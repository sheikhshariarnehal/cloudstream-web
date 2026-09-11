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

            val targetUrl = try { URLDecoder.decode(rawUrl, "UTF-8") } catch (_: Exception) { rawUrl }
            val session = ProxySessionManager.getSession(sessionId)

            val reqBuilder = Request.Builder().url(targetUrl)
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
            val rewritten = HlsPlaylistRewriter.rewritePlaylist(rawBody, targetUrl, sessionId)

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

            val targetUrl = try { URLDecoder.decode(rawUrl, "UTF-8") } catch (_: Exception) { rawUrl }
            val session = ProxySessionManager.getSession(sessionId)

            val reqBuilder = Request.Builder().url(targetUrl)
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
            val contentLength = response.header("Content-Length")
            val contentRange = response.header("Content-Range")

            call.response.headers.append("Access-Control-Allow-Origin", "*")
            call.response.headers.append("Access-Control-Allow-Headers", "*")
            call.response.headers.append("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges")
            call.response.headers.append("Accept-Ranges", "bytes")
            if (contentLength != null) call.response.headers.append("Content-Length", contentLength)
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

        get("/video") {
            // Direct MP4 / MKV video stream proxy with HTTP Range forwarding
            val rawUrl = call.request.queryParameters["url"]
            val sessionId = call.request.queryParameters["sessionId"] ?: ""
            if (rawUrl.isNullOrBlank()) {
                call.respond(HttpStatusCode.BadRequest, "Missing url parameter")
                return@get
            }

            val targetUrl = try { URLDecoder.decode(rawUrl, "UTF-8") } catch (_: Exception) { rawUrl }
            val session = ProxySessionManager.getSession(sessionId)

            val reqBuilder = Request.Builder().url(targetUrl)
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
            val contentTypeStr = response.header("Content-Type") ?: "video/mp4"
            val contentLength = response.header("Content-Length")
            val contentRange = response.header("Content-Range")

            call.response.headers.append("Access-Control-Allow-Origin", "*")
            call.response.headers.append("Access-Control-Allow-Headers", "*")
            call.response.headers.append("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges")
            call.response.headers.append("Accept-Ranges", "bytes")
            if (contentLength != null) call.response.headers.append("Content-Length", contentLength)
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

            val targetUrl = try { URLDecoder.decode(rawUrl, "UTF-8") } catch (_: Exception) { rawUrl }
            val req = Request.Builder().url(targetUrl).build()
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
