package com.lagradost.cloudstream.server.proxy

import com.lagradost.cloudstream3.app
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import okhttp3.Request
import java.net.URLDecoder

fun Route.streamProxyRoutes() {
    route("/api/proxy") {

        get("/m3u8") {
            val rawUrl = call.request.queryParameters["url"]
            val sessionId = call.request.queryParameters["sessionId"] ?: ""
            if (rawUrl.isNullOrBlank()) {
                call.respond(HttpStatusCode.BadRequest, "Missing url parameter")
                return@get
            }

            val targetUrl = try { if (rawUrl.contains("%")) URLDecoder.decode(rawUrl, "UTF-8") else rawUrl } catch (_: Exception) { rawUrl }
            val safeUrl = targetUrl.replace(" ", "%20")
            val session = ProxySessionManager.getSession(sessionId)

            val reqBuilder = Request.Builder().url(safeUrl)
            session?.headers?.forEach { (k, v) -> reqBuilder.header(k, v) }
            if (session?.headers?.keys?.none { it.equals("user-agent", ignoreCase = true) } != false) {
                reqBuilder.header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
            }

            val response = try {
                app.baseClient.newCall(reqBuilder.build()).execute()
            } catch (e: Exception) {
                call.respond(HttpStatusCode.BadGateway, "Upstream error: ${e.message}")
                return@get
            }

            if (!response.isSuccessful) {
                val code = HttpStatusCode.fromValue(response.code)
                response.close()
                call.respond(code, "Upstream returned ${response.code}")
                return@get
            }

            val rawBody = response.body?.string() ?: ""
            val rewritten = HlsPlaylistRewriter.rewritePlaylist(rawBody, safeUrl, sessionId)

            call.response.headers.append("Access-Control-Allow-Origin", "*")
            call.response.headers.append("Access-Control-Allow-Headers", "*")
            call.respondText(rewritten, ContentType.parse("application/vnd.apple.mpegurl"), HttpStatusCode.OK)
        }

        get("/segment") {
            val rawUrl = call.request.queryParameters["url"]
            val sessionId = call.request.queryParameters["sessionId"] ?: ""
            if (rawUrl.isNullOrBlank()) {
                call.respond(HttpStatusCode.BadRequest, "Missing url parameter")
                return@get
            }

            val targetUrl = try { if (rawUrl.contains("%")) URLDecoder.decode(rawUrl, "UTF-8") else rawUrl } catch (_: Exception) { rawUrl }
            val safeUrl = targetUrl.replace(" ", "%20")
            val session = ProxySessionManager.getSession(sessionId)

            val reqBuilder = Request.Builder().url(safeUrl)
            session?.headers?.forEach { (k, v) -> reqBuilder.header(k, v) }
            if (session?.headers?.keys?.none { it.equals("user-agent", ignoreCase = true) } != false) {
                reqBuilder.header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
            }

            val rangeHeader = call.request.headers["Range"]
            if (!rangeHeader.isNullOrBlank()) {
                reqBuilder.header("Range", rangeHeader)
            }

            val response = try {
                app.baseClient.newCall(reqBuilder.build()).execute()
            } catch (e: Exception) {
                call.respond(HttpStatusCode.BadGateway, "Upstream segment error: ${e.message}")
                return@get
            }

            val statusCode = HttpStatusCode.fromValue(response.code)
            val contentTypeStr = response.header("Content-Type") ?: "video/MP2T"
            val contentRange = response.header("Content-Range")

            call.response.headers.append("Access-Control-Allow-Origin", "*")
            call.response.headers.append("Access-Control-Allow-Headers", "*")
            call.response.headers.append("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges")
            call.response.headers.append("Accept-Ranges", "bytes")
            if (contentRange != null) call.response.headers.append("Content-Range", contentRange)

            val bodyStream = response.body?.byteStream()
            if (bodyStream == null) {
                response.close()
                call.respond(statusCode)
                return@get
            }

            call.respondOutputStream(ContentType.parse(contentTypeStr), statusCode) {
                bodyStream.use { input ->
                    input.copyTo(this)
                }
                response.close()
            }
        }

        head("/video") {
            val rawUrl = call.request.queryParameters["url"]
            val sessionId = call.request.queryParameters["sessionId"] ?: ""
            if (rawUrl.isNullOrBlank()) {
                call.respond(HttpStatusCode.BadRequest)
                return@head
            }

            val targetUrl = try { if (rawUrl.contains("%")) URLDecoder.decode(rawUrl, "UTF-8") else rawUrl } catch (_: Exception) { rawUrl }
            val safeUrl = targetUrl.replace(" ", "%20")
            val session = ProxySessionManager.getSession(sessionId)

            val reqBuilder = Request.Builder().url(safeUrl).head()
            session?.headers?.forEach { (k, v) -> reqBuilder.header(k, v) }
            if (session?.headers?.keys?.none { it.equals("user-agent", ignoreCase = true) } != false) {
                reqBuilder.header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
            }

            val response = try {
                app.baseClient.newCall(reqBuilder.build()).execute()
            } catch (_: Exception) {
                call.respond(HttpStatusCode.BadGateway)
                return@head
            }

            val statusCode = HttpStatusCode.fromValue(response.code)
            val rawContentType = response.header("Content-Type")
            val contentTypeStr = if (rawContentType.isNullOrBlank() || rawContentType == "application/octet-stream") {
                when {
                    safeUrl.contains(".mp4", ignoreCase = true) -> "video/mp4"
                    safeUrl.contains(".mkv", ignoreCase = true) -> "video/x-matroska"
                    safeUrl.contains(".webm", ignoreCase = true) -> "video/webm"
                    safeUrl.contains(".avi", ignoreCase = true) -> "video/x-msvideo"
                    else -> "video/mp4"
                }
            } else {
                rawContentType
            }
            val contentLength = response.header("Content-Length")

            call.response.headers.append("Access-Control-Allow-Origin", "*")
            call.response.headers.append("Access-Control-Allow-Headers", "*")
            call.response.headers.append("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges")
            call.response.headers.append("Accept-Ranges", "bytes")
            if (contentLength != null) call.response.headers.append("Content-Length", contentLength)
            response.close()
            call.respondBytes(ByteArray(0), ContentType.parse(contentTypeStr), statusCode)
        }

        get("/video") {
            // Direct MP4 / MKV video stream proxy with HTTP Range forwarding
            val rawUrl = call.request.queryParameters["url"]
            val sessionId = call.request.queryParameters["sessionId"] ?: ""
            if (rawUrl.isNullOrBlank()) {
                call.respond(HttpStatusCode.BadRequest, "Missing url parameter")
                return@get
            }

            val targetUrl = try { if (rawUrl.contains("%")) URLDecoder.decode(rawUrl, "UTF-8") else rawUrl } catch (_: Exception) { rawUrl }
            val safeUrl = targetUrl.replace(" ", "%20")
            val session = ProxySessionManager.getSession(sessionId)

            val reqBuilder = Request.Builder().url(safeUrl)
            session?.headers?.forEach { (k, v) -> reqBuilder.header(k, v) }
            if (session?.headers?.keys?.none { it.equals("user-agent", ignoreCase = true) } != false) {
                reqBuilder.header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
            }

            val rangeHeader = call.request.headers["Range"]
            if (!rangeHeader.isNullOrBlank()) {
                reqBuilder.header("Range", rangeHeader)
            }

            val response = try {
                app.baseClient.newCall(reqBuilder.build()).execute()
            } catch (e: Exception) {
                call.respond(HttpStatusCode.BadGateway, "Upstream video error: ${e.message}")
                return@get
            }

            val statusCode = HttpStatusCode.fromValue(response.code)
            val rawContentType = response.header("Content-Type")
            val contentTypeStr = if (rawContentType.isNullOrBlank() || rawContentType == "application/octet-stream") {
                when {
                    safeUrl.contains(".mp4", ignoreCase = true) -> "video/mp4"
                    safeUrl.contains(".mkv", ignoreCase = true) -> "video/x-matroska"
                    safeUrl.contains(".webm", ignoreCase = true) -> "video/webm"
                    safeUrl.contains(".avi", ignoreCase = true) -> "video/x-msvideo"
                    else -> "video/mp4"
                }
            } else {
                rawContentType
            }
            val contentRange = response.header("Content-Range")

            call.response.headers.append("Access-Control-Allow-Origin", "*")
            call.response.headers.append("Access-Control-Allow-Headers", "*")
            call.response.headers.append("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges")
            call.response.headers.append("Accept-Ranges", "bytes")
            if (contentRange != null) call.response.headers.append("Content-Range", contentRange)

            val bodyStream = response.body?.byteStream()
            if (bodyStream == null) {
                response.close()
                call.respond(statusCode)
                return@get
            }

            call.respondOutputStream(ContentType.parse(contentTypeStr), statusCode) {
                bodyStream.use { input ->
                    input.copyTo(this)
                }
                response.close()
            }
        }

        get("/sub") {
            // Subtitle fetch proxy (converts SRT to VTT if needed)
            val rawUrl = call.request.queryParameters["url"]
            if (rawUrl.isNullOrBlank()) {
                call.respond(HttpStatusCode.BadRequest, "Missing url parameter")
                return@get
            }

            val targetUrl = try { if (rawUrl.contains("%")) URLDecoder.decode(rawUrl, "UTF-8") else rawUrl } catch (_: Exception) { rawUrl }
            val safeUrl = targetUrl.replace(" ", "%20")
            val req = Request.Builder().url(safeUrl).build()
            val response = try {
                app.baseClient.newCall(req).execute()
            } catch (e: Exception) {
                call.respond(HttpStatusCode.BadGateway, "Failed fetching subtitle: ${e.message}")
                return@get
            }

            val subText = response.body?.string() ?: ""
            response.close()

            val vttText = if (targetUrl.endsWith(".srt", ignoreCase = true) || !subText.startsWith("WEBVTT")) {
                "WEBVTT\n\n" + subText.replace(Regex("""(\d{2}:\d{2}:\d{2}),(\d{3})"""), "$1.$2")
            } else {
                subText
            }

            call.response.headers.append("Access-Control-Allow-Origin", "*")
            call.respondText(vttText, ContentType.parse("text/vtt; charset=utf-8"), HttpStatusCode.OK)
        }
    }
}
