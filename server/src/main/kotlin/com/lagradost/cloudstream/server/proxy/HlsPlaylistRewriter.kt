package com.lagradost.cloudstream.server.proxy

import java.net.URI
import java.net.URLEncoder

object HlsPlaylistRewriter {

    fun rewritePlaylist(
        originalM3u8: String,
        playlistUrl: String,
        sessionId: String,
        proxyHostPort: String = ""
    ): String {
        val basePrefix = if (proxyHostPort.isNotBlank()) "http://$proxyHostPort" else ""
        val playlistUri = try { URI(playlistUrl) } catch (_: Exception) { null }

        fun resolveUri(line: String): String {
            val trimmed = line.trim()
            return when {
                trimmed.startsWith("http://", ignoreCase = true) ||
                trimmed.startsWith("https://", ignoreCase = true) -> trimmed
                trimmed.startsWith("/") && playlistUri != null -> {
                    val portPart = if (playlistUri.port != -1) ":${playlistUri.port}" else ""
                    "${playlistUri.scheme}://${playlistUri.host}$portPart$trimmed"
                }
                else -> {
                    val base = playlistUrl.substringBeforeLast("/") + "/"
                    base + trimmed
                }
            }
        }

        val lines = originalM3u8.lines()
        val result = StringBuilder()
        var isVariantStream = false

        for (rawLine in lines) {
            val line = rawLine.trim()
            if (line.isEmpty()) {
                result.append("\n")
                continue
            }

            if (line.startsWith("#")) {
                if (line.startsWith("#EXT-X-STREAM-INF")) {
                    isVariantStream = true
                    result.append(rawLine).append("\n")
                } else if (line.startsWith("#EXT-X-MEDIA") && line.contains("URI=\"")) {
                    // Rewrite subtitle or alternate audio URIs
                    val uriRegex = Regex("""URI="([^"]+)"""")
                    val rewritten = uriRegex.replace(rawLine) { matchResult ->
                        val subUri = matchResult.groupValues[1]
                        val resolved = resolveUri(subUri)
                        val encoded = URLEncoder.encode(resolved, "UTF-8")
                        """URI="$basePrefix/api/proxy/m3u8?url=$encoded&sessionId=$sessionId""""
                    }
                    result.append(rewritten).append("\n")
                } else if (line.startsWith("#EXT-X-KEY") && line.contains("URI=\"")) {
                    // Rewrite AES-128 decryption key URIs
                    val uriRegex = Regex("""URI="([^"]+)"""")
                    val rewritten = uriRegex.replace(rawLine) { matchResult ->
                        val keyUri = matchResult.groupValues[1]
                        val resolved = resolveUri(keyUri)
                        val encoded = URLEncoder.encode(resolved, "UTF-8")
                        """URI="$basePrefix/api/proxy/segment?url=$encoded&sessionId=$sessionId""""
                    }
                    result.append(rewritten).append("\n")
                } else if (line.startsWith("#EXT-X-MAP") && line.contains("URI=\"")) {
                    // Rewrite init segment (fMP4) URIs
                    val uriRegex = Regex("""URI="([^"]+)"""")
                    val rewritten = uriRegex.replace(rawLine) { matchResult ->
                        val initUri = matchResult.groupValues[1]
                        val resolved = resolveUri(initUri)
                        val encoded = URLEncoder.encode(resolved, "UTF-8")
                        """URI="$basePrefix/api/proxy/segment?url=$encoded&sessionId=$sessionId""""
                    }
                    result.append(rewritten).append("\n")
                } else {
                    result.append(rawLine).append("\n")
                }
            } else {
                // Segment URL or child playlist URL
                val resolved = resolveUri(line)
                val encoded = URLEncoder.encode(resolved, "UTF-8")
                if (isVariantStream) {
                    result.append("$basePrefix/api/proxy/m3u8?url=$encoded&sessionId=$sessionId").append("\n")
                    isVariantStream = false
                } else {
                    result.append("$basePrefix/api/proxy/segment?url=$encoded&sessionId=$sessionId").append("\n")
                }
            }
        }

        return result.toString()
    }
}
