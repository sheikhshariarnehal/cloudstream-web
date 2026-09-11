package com.lagradost.cloudstream.server.proxy

import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

data class StreamSession(
    val id: String,
    val targetUrl: String,
    val headers: Map<String, String>,
    val createdAt: Long = System.currentTimeMillis()
)

object ProxySessionManager {
    private val sessions = ConcurrentHashMap<String, StreamSession>()

    fun createSession(targetUrl: String, headers: Map<String, String>): String {
        val id = UUID.randomUUID().toString().take(8)
        sessions[id] = StreamSession(id, targetUrl, headers)
        // Clean up old sessions (> 6 hours old)
        val cutoff = System.currentTimeMillis() - 6 * 3600 * 1000
        sessions.entries.removeIf { it.value.createdAt < cutoff }
        return id
    }

    fun getSession(id: String?): StreamSession? {
        if (id == null) return null
        return sessions[id]
    }
}
