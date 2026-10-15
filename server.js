import { actor, event, setup } from "rivetkit";

// ==================== ACTOR LOBBY ====================
const lobby = actor({
  state: {
    name: "",
    host: "",
    hostId: "",
    maxPlayers: 4,
    password: null,
    players: [],
    messages: [],
    gameStarted: false,
  },
  events: {
    lobbyUpdated: event(),
    gameStarting: event(),
  },
  actions: {
    init(c, { name, maxPlayers, password, host, hostId }) {
      c.state.name = name;
      c.state.maxPlayers = maxPlayers;
      c.state.password = password;
      c.state.host = host;
      c.state.hostId = hostId;
      c.state.players = [{ id: hostId, username: host, ready: false }];
      c.state.messages = [{ type: "sys", text: host + " ha creato la lobby", time: Date.now() }];
      c.broadcast("lobbyUpdated", c.state);
    },

    join(c, { userId, username, password }) {
      if (c.state.gameStarted) throw new Error("Partita gia iniziata");
      if (c.state.players.length >= c.state.maxPlayers) throw new Error("Lobby piena");
      if (c.state.password && c.state.password !== password) throw new Error("Password errata");
      if (!c.state.players.find(p => p.id === userId)) {
        c.state.players.push({ id: userId, username, ready: false });
        c.state.messages.push({ type: "sys", text: username + " e entrato", time: Date.now() });
      }
      c.broadcast("lobbyUpdated", c.state);
      return c.state;
    },

    sendMessage(c, { username, text }) {
      if (!text || !text.trim()) return;
      c.state.messages.push({ type: "chat", sender: username, text, time: Date.now() });
      c.broadcast("lobbyUpdated", c.state);
    },

    toggleReady(c, { userId }) {
      const p = c.state.players.find(p => p.id === userId);
      if (p) p.ready = !p.ready;
      c.broadcast("lobbyUpdated", c.state);
    },

    leave(c, { userId }) {
      const leaving = c.state.players.find(p => p.id === userId);
      c.state.players = c.state.players.filter(p => p.id !== userId);
      if (leaving) {
        c.state.messages.push({ type: "sys", text: leaving.username + " e uscito", time: Date.now() });
      }
      if (c.state.hostId === userId && c.state.players.length > 0) {
        c.state.host = c.state.players[0].username;
        c.state.hostId = c.state.players[0].id;
      }
      c.broadcast("lobbyUpdated", c.state);
    },

    startGame(c, { userId }) {
      if (c.state.hostId !== userId) throw new Error("Solo l host puo avviare");
      if (!c.state.players.every(p => p.ready)) throw new Error("Tutti devono essere pronti");
      c.state.gameStarted = true;
      c.state.messages.push({ type: "sys", text: "Partita avviata!", time: Date.now() });
      c.broadcast("gameStarting", { lobbyId: c.actorId });
      c.broadcast("lobbyUpdated", c.state);
    },

    getState(c) {
      return c.state;
    },
  },
});

// ==================== ACTOR MATCHMAKER ====================
const matchmaker = actor({
  state: {
    lobbies: [],
  },
  events: {
    lobbiesUpdated: event(),
  },
  actions: {
    registerLobby(c, lobbyInfo) {
      c.state.lobbies.push(lobbyInfo);
      c.broadcast("lobbiesUpdated", c.state.lobbies);
    },
    removeLobby(c, { lobbyId }) {
      c.state.lobbies = c.state.lobbies.filter(l => l.id !== lobbyId);
      c.broadcast("lobbiesUpdated", c.state.lobbies);
    },
    getLobbies(c) {
      return c.state.lobbies;
    },
  },
});

// ==================== SETUP ====================
const registry = setup({
  use: { lobby, matchmaker },
});

registry.start();