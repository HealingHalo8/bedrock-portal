import debugFn from 'debug'
import { v4 as uuidV4 } from 'uuid'
import { Authflow } from 'prismarine-auth'
import { EventResponse, XboxRTA } from 'xbox-rta'
import { TypedEmitter } from 'tiny-typed-emitter'

import Host from './classes/Host'
import Player from './classes/Player'
import Module from './classes/Module'

import { SessionConfig, Joinability, JoinabilityConfig } from './common/constants'

import eventHandler from './handlers/Event'
import { RESTSessionResponse, SessionRequest } from './types/sessiondirectory'
import { LastMessage } from './types/xblmessaging'

import AutoFriendAdd from './modules/autoFriendAdd'
import InviteOnMessage from './modules/inviteOnMessage'
import RedirectFromRealm from './modules/redirectFromRealm'

const debug = debugFn('bedrock-portal')

const genRaknetGUID = () => {
  const chars = '0123456789'
  let result = ''
  for (let i = 20; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)]
  return result
}

type BedrockPortalOptions = {

  /**
   * The ip of the server to redirect users to.
   */
  ip: string,

  /**
   * The port the server is running on.
   * @default 19132
   */
  port: number,

  /**
   * If true disables the alt check
   * @default false
   * @warning We recommend using an alt account with BedrockPortal instead of disabling the alt check.
   */
  disableAltCheck: boolean,

  /**
   * The joinability of the session.
   * @default Joinability.FriendsOfFriends
   * @see {@link Joinability}
   * @example
   * const { BedrockPortal, Joinability } = require('bedrock-portal')
   *
   * portal = new BedrockPortal(auth, {
   *   joinability: Joinability.InviteOnly
   * })
   *
   * portal = new BedrockPortal(auth, {
   *   joinability: Joinability.FriendsOnly
   * })
   *
   * portal = new BedrockPortal(auth, {
   *   joinability: Joinability.FriendsOfFriends
   * })
   */
  joinability: Joinability,

  /**
   * The world config to use for the session. Changes the session card which is displayed in the Minecraft client
   */
  world: {


    /**
     * The host name of the world.
     */
    hostName: string,

    /**
     * The name of the world.
     */
    name: string,

    /**
     * The version of the world. Doesn't have to be a real version.
     */
    version: string,

    /**
     * The current player count of the world.
     * @default 0
     */
    memberCount: number,

    /**
     * The max player count of the world. Doesn't affect the session.
     * @default 10
     */
    maxMemberCount: number,

  },
};

interface PortalEvents {
  sessionCreated: (session: RESTSessionResponse) => void
  sessionUpdated: (session: RESTSessionResponse) => void
  rtaEvent: (event: EventResponse) => void
  playerJoin: (player: Player) => void
  playerLeave: (player: Player) => void
  messageRecieved: (message: LastMessage) => void
  friendRemoved: (player: Player) => void
  friendAdded: (player: Player) => void
}

export class BedrockPortal extends TypedEmitter<PortalEvents> {

  public authflow: Authflow

  public host: Host

  public options: BedrockPortalOptions

  public session: { name: string, subscriptionId: string }

  public players: Map<string, Player>

  public modules: { [x: string]: Module } | undefined

  constructor(authflow: Authflow, options: Partial<BedrockPortalOptions>) {
    super()

    this.options = {
      ip: '',
      port: 19132,
      disableAltCheck: false,
      joinability: Joinability.FriendsOfFriends,
      ...options,
      world: {
        hostName: 'Bedrock Portal v0.5.1',
        name: 'By LucienHH',
        version: '0.5.1',
        memberCount: 0,
        maxMemberCount: 10,
        ...options.world,
      },
    }

    this.validateOptions(this.options)

    this.authflow = authflow

    this.host = new Host(this, this.authflow)

    this.session = { name: '', subscriptionId: '' }

    this.players = new Map()
  }

  validateOptions(options: BedrockPortalOptions) {
    if (!options.ip) throw new Error('No IP provided')
    if (!options.port) throw new Error('No port provided')
    if (!Object.keys(Joinability).includes(options.joinability)) throw new Error('Invalid joinability - Expected one of ' + Object.keys(Joinability).join(', '))
  }

  /**
   * Starts the BedrockPortal instance.
   */
  async start() {


    await this.host.connect()

    this.session.name = uuidV4()

    const session = await this.createAndPublishSession()

    this.host.rta!.on('event', (event) => eventHandler(this, event))

    if (this.modules) {
      Object.values(this.modules).forEach(mod => {
        mod.run(this, this.rest, this.rta)
          .then(() => debug(`Module ${mod.name} has run`))
          .catch(e => debug(`Module ${mod.name} failed to run`, e))
      })
    }

    this.emit('sessionCreated', session)
  }

  /**
   * Ends the BedrockPortal instance.
   */
  async end(resume = false) {

    if (this.host.rta) {
      await this.host.rta.destroy()
    }

    await this.host.rest.leaveSession(this.session.name)
      .catch(() => { debug('Failed to leave session as host') })

    if (this.modules) {
      for (const mod of Object.values(this.modules)) {
        mod.stop()
      }
    }

    debug(`Abandoned session, name: ${this.session.name} - Resume: ${resume}`)

    if (resume) {
      return this.start()
    }
  }

  /**
   * Returns the current members in the session.
   */
  getSessionMembers() {
    return this.players
  }

  /**
   * Invites a player to the BedrockPortal instance.
   * @param identifyer The player's gamertag or XUID.
   */
  async invitePlayer(identifier: string) {
    debug(`Inviting player, identifier: ${identifier}`)

    const profile = await this.host.rest.getProfile(identifier)
      .catch(() => { throw new Error(`Failed to get profile for identifier: ${identifier}`) })

    debug(`Inviting player, Got profile, xuid: ${profile.xuid}`)

    await this.host.rest.sendInvite(this.session.name, profile.xuid)

    debug(`Invited player, xuid: ${profile.xuid}`)
  }

  /**
   * Updates the current member count which is displayed in the Minecraft client.
   * @param count The new member count.
   */
  async updateMemberCount(count: number) {
    await this.host.rest.updateMemberCount(this.session.name, count)
  }

  /**
   * Gets the current session of the BedrockPortal instance.
   */
  async getSession() {
    return await this.host.rest.getSession(this.session.name)
  }

  /**
   * Updates the current session of the BedrockPortal instance with the specified payload.
   * @param payload The payload to update the session with.
   */
  async updateSession(payload: SessionRequest) {
    await this.host.rest.updateSession(this.session.name, payload)
  }

  /**
   * Enables a module for the BedrockPortal instance.
   * @see [Modules](https://github.com/LucienHH/bedrock-portal#modules) for a list of available modules or to create your own.
   * @example
   * portal.use(Modules.autoFriendAdd)
   * @example
   * portal.use(Modules.autoFriendAdd, {
   *   inviteOnAdd: true
   * })
   */
  use(mod: Module, options = {}) {

    debug(`Enabled module: ${mod.name}`)

    this.modules = this.modules || {}

    // if (typeof mod === 'function') mod = new mod();
    if (!(mod instanceof Module)) throw new Error('Module must extend the base module')
    if (this.modules[mod.name]) throw new Error(`Module with name ${mod.name} has already been loaded`)

    mod.applyOptions(options)

    this.modules[mod.name] = mod
  }

    this.players = new Map()
  private async createAndPublishSession() {

    await this.updateSession(this.createSessionBody())

    debug(`Created session, name: ${this.session.name}`)

    await this.host.rest.setActivity(this.session.name)

    const session = await this.getSession()

    await this.updateSession({ properties: session.properties })

    debug(`Published session, name: ${this.session.name}`)

    return session
  }

  private createSessionBody(): SessionRequest {

    if (!this.host.profile || !this.host.connectionId) throw new Error('No session owner')

    const joinability = JoinabilityConfig[this.options.joinability]

    return {
      properties: {
        system: {
          joinRestriction: joinability.joinRestriction,
          readRestriction: 'followed',
          closed: false,
        },
        custom: {
          hostName: String(this.options.world.hostName),
          worldName: String(this.options.world.name),
          version: String(this.options.world.version),
          MemberCount: Number(this.options.world.memberCount),
          MaxMemberCount: Number(this.options.world.maxMemberCount),
          Joinability: joinability.joinability,
          ownerId: this.host.profile.xuid,
          rakNetGUID: genRaknetGUID(),
          worldType: 'Survival',
          protocol: SessionConfig.MiencraftProtocolVersion,
          BroadcastSetting: joinability.broadcastSetting,
          OnlineCrossPlatformGame: true,
          CrossPlayDisabled: false,
          TitleId: 0,
          TransportLayer: 0,
          SupportedConnections: [
            {
              ConnectionType: 6,
              HostIpAddress: this.options.ip,
              HostPort: Number(this.options.port),
              RakNetGUID: '',
            },
          ],
        },
      },
      members: {
        me: {
          constants: {
            system: {
              xuid: this.host.profile.xuid,
              initialize: true,
            },
          },
          properties: {
            system: {
              active: true,
              connection: this.host.connectionId,
              subscription: {
                id: this.host.subscriptionId,
                changeTypes: ['everything'],
              },
            },
          },
        },
      },
    }
  }
}

// Export joinability
export { Joinability } from './common/constants'
export { Module }

const Modules = {
  AutoFriendAdd,
  InviteOnMessage,
  RedirectFromRealm,
}

export { Modules }
