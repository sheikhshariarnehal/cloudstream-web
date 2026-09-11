package com.lagradost.cloudstream.server.routes

import com.lagradost.cloudstream.server.models.LoadLinksResponseDTO
import com.lagradost.cloudstream.server.models.StreamLinkDTO
import com.lagradost.cloudstream.server.models.SubtitleDTO
import com.lagradost.cloudstream.server.plugins.ServerPluginLoader
import com.lagradost.cloudstream.server.proxy.ProxySessionManager
import com.lagradost.cloudstream3.SubtitleFile
import com.lagradost.cloudstream3.utils.ExtractorLink
import com.lagradost.cloudstream3.utils.ExtractorLinkType
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.net.URLDecoder
import java.net.URLEncoder
import java.util.concurrent.CopyOnWriteArrayList

fun Route.linksRoutes() {
    route("/api/loadLinks") {
        get {
            val apiName = call.request.queryParameters["api"]
            val rawData = call.request.queryParameters["data"]

            if (apiName.isNullOrBlank() || rawData.isNullOrBlank()) {
                call.respond(HttpStatusCode.BadRequest, "Missing api or data parameter")
                return@get
            }

            val data = try { URLDecoder.decode(rawData, "UTF-8") } catch (_: Exception) { rawData }
            val provider = ServerPluginLoader.getProvider(apiName)
            if (provider == null) {
                call.respond(HttpStatusCode.NotFound, "Provider $apiName not found")
                return@get
            }

            val extractedLinks = CopyOnWriteArrayList<StreamLinkDTO>()
            val extractedSubs = CopyOnWriteArrayList<SubtitleDTO>()

            try {
                provider.loadLinks(
                    data = data,
                    isCasting = false,
                    subtitleCallback = { sub: SubtitleFile ->
                        val encodedSubUrl = URLEncoder.encode(sub.url, "UTF-8")
                        extractedSubs.add(
                            SubtitleDTO(
                                id = null,
                                lang = sub.lang,
                                url = "/api/proxy/sub?url=$encodedSubUrl",
                                autoSelect = false
                            )
                        )
                    },
                    callback = { link: ExtractorLink ->
                        val isM3u8 = link.type == ExtractorLinkType.M3U8 || link.url.contains(".m3u8", ignoreCase = true)
                        val sessionId = ProxySessionManager.createSession(link.url, link.headers)
                        val encodedUrl = URLEncoder.encode(link.url, "UTF-8")
                        val proxyEndpoint = if (isM3u8) "/api/proxy/m3u8" else "/api/proxy/video"
                        val proxiedUrl = "$proxyEndpoint?url=$encodedUrl&sessionId=$sessionId"

                        extractedLinks.add(
                            StreamLinkDTO(
                                name = link.name,
                                url = proxiedUrl,
                                rawUrl = link.url,
                                referer = link.referer,
                                quality = link.quality,
                                isM3u8 = isM3u8,
                                headers = link.headers
                            )
                        )
                    }
                )

                // Sort links by quality descending (1080p, 720p, etc.)
                val sortedLinks = extractedLinks.sortedByDescending { it.quality }
                call.respond(LoadLinksResponseDTO(links = sortedLinks, subtitles = extractedSubs.distinctBy { it.url }))
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, "Error extracting links: ${e.message}")
            }
        }
    }
}
