import { io } from "socket.io-client";

export default class Socketable {
    #socket;
    #sessionId;

    constructor(serverUrl) {
        if (!serverUrl) {
            throw new Error("Server URL is required for Socketable.");
        }

        // Initialize the socket connection
        this.#socket = io(serverUrl, {
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        // Handle connection events
        this.#socket.on("connect", () => {
            console.log("Connected to server:", serverUrl);
            this.onConnect();
        });

        this.#socket.on("disconnect", () => {
            console.log("Disconnected from server");
            this.onDisconnect();
        });

        this.#socket.on("connect_error", (error) => {
            console.error("Connection error:", error);
        });

        this.#socket.on("*", (data) => {
            console.log("received");
            console.log(data);
        });
    }

    joinSession(sessionId) {
        console.log("emitting join")
        this.#sessionId = sessionId;
        this.#socket.emit("join_session", sessionId)
    }

    /** Hook for when the socket connects (to be overridden by subclasses) */
    onConnect() {
        console.log("Socketable connected. Override this method in subclasses.");
    }

    /** Hook for when the socket disconnects (to be overridden by subclasses) */
    onDisconnect() {
        console.log("Socketable disconnected. Override this method in subclasses.");
    }

    /** Emit an event with data */
    emit(event, data) {
        if (this.sessionId === null) {
            console.warn("No sessionId. Unable to emit event:", event);
            return;
        }

        if (this.#socket && this.#socket.connected) {
            console.log("socketable is emitting ", event, data, this.#sessionId);
            this.#socket.emit(event, {data: data, sessionId: this.#sessionId});
        } else {
            console.warn("Socket is not connected. Unable to emit event:", event);
        }
    }

    /** Listen for an event */
    on(event, callback) {
        this.#socket.on(event, (data) => {
            console.log("on event", event, this.#socket.id)
            callback(this.#socket.id, data)
        });
    }

    /** Disconnect from the server */
    disconnect() {
        if (this.#socket) {
            this.#socket.disconnect();
        }
    }
}