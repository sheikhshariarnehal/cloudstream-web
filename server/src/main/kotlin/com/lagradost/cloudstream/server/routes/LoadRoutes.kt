package com.lagradost.cloudstream.server.routes

import com.lagradost.cloudstream.server.models.ActorDTO
import com.lagradost.cloudstream.server.models.EpisodeDTO
import com.lagradost.cloudstream.server.models.LoadResponseDTO
import com.lagradost.cloudstream.server.plugins.ServerPluginLoader
import com.lagradost.cloudstream3.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.net.URLDecoder

fun Route.loadRoutes() {
    route("/api/load") {
        get {
            val apiName = call.request.queryParameters["api"]
            val rawUrl = call.request.queryParameters["url"]

            if (apiName.isNullOrBlank() || rawUrl.isNullOrBlank()) {
                call.respond(HttpStatusCode.BadRequest, "Missing api or url parameter")
                return@get
            }

            val targetUrl = try { if (rawUrl.contains("%")) URLDecoder.decode(rawUrl, "UTF-8") else rawUrl } catch (_: Exception) { rawUrl }
            val provider = ServerPluginLoader.getProvider(apiName)
            if (provider == null) {
                call.respond(HttpStatusCode.NotFound, "Provider $apiName not found")
                return@get
            }

            try {
                var response = try { provider.load(targetUrl) } catch (_: Exception) { null }
                if (response == null && targetUrl != rawUrl) {
                    response = try { provider.load(rawUrl) } catch (_: Exception) { null }
                }
                if (response == null) {
                    call.respond(HttpStatusCode.NotFound, "No data returned by provider")
                    return@get
                }

                val episodes = mutableListOf<EpisodeDTO>()
                when (response) {
                    is TvSeriesLoadResponse -> {
                        episodes.addAll(response.episodes.map { ep ->
                            EpisodeDTO(
                                name = ep.name,
                                season = ep.season,
                                episode = ep.episode,
                                data = ep.data,
                                posterUrl = ep.posterUrl,
                                synopsis = ep.description,
                                rating = ep.score?.toInt(100),
                                date = ep.date?.toString(),
                                isFiller = false
                            )
                        })
                    }
                    is AnimeLoadResponse -> {
                        // Gather episodes across all dub/sub categories
                        val allEps = response.episodes.values.flatten().distinctBy { "${it.season}_${it.episode}" }
                        episodes.addAll(allEps.map { ep ->
                            EpisodeDTO(
                                name = ep.name,
                                season = ep.season,
                                episode = ep.episode,
                                data = ep.data,
                                posterUrl = ep.posterUrl,
                                synopsis = ep.description,
                                rating = ep.score?.toInt(100),
                                date = ep.date?.toString(),
                                isFiller = false
                            )
                        })
                    }
                    is MovieLoadResponse -> {
                        episodes.add(
                            EpisodeDTO(
                                name = response.name,
                                season = 1,
                                episode = 1,
                                data = response.dataUrl,
                                posterUrl = response.posterUrl,
                                synopsis = response.plot,
                                isFiller = false
                            )
                        )
                    }
                    else -> {
                        // Generic fallback
                    }
                }

                val actors = response.actors?.map { actorData ->
                    ActorDTO(
                        name = actorData.actor.name,
                        image = actorData.actor.image,
                        role = actorData.roleString
                    )
                } ?: emptyList()

                val recommendations = response.recommendations?.map { it.toDTO() } ?: emptyList()

                val dto = LoadResponseDTO(
                    name = response.name,
                    url = response.url,
                    apiName = response.apiName,
                    type = response.type.name,
                    posterUrl = response.posterUrl,
                    backgroundPosterUrl = response.backgroundPosterUrl,
                    year = response.year,
                    plot = response.plot,
                    rating = response.score?.toInt(100),
                    tags = response.tags ?: emptyList(),
                    duration = response.duration?.toString(),
                    status = (response as? ShowStatus)?.let { it.toString() },
                    actors = actors,
                    episodes = episodes,
                    recommendations = recommendations
                )

                call.respond(dto)
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, "Error loading media details: ${e.message}")
            }
        }
    }
}
