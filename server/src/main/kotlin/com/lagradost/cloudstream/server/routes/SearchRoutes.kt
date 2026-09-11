package com.lagradost.cloudstream.server.routes

import com.lagradost.cloudstream.server.models.SearchResponseDTO
import com.lagradost.cloudstream.server.models.SearchStreamEventDTO
import com.lagradost.cloudstream.server.plugins.ServerPluginLoader
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.Writer

object SearchJson {
    val instance = Json { ignoreUnknownKeys = true; explicitNulls = false }
}

fun Route.searchRoutes() {
    route("/api/search") {

        get {
            val query = call.request.queryParameters["q"]
            if (query.isNullOrBlank()) {
                call.respond(HttpStatusCode.BadRequest, "Missing search query")
                return@get
            }

            val apisParam = call.request.queryParameters["apis"]
            val active = ServerPluginLoader.getActiveProviders()
            val targetApis = if (!apisParam.isNullOrBlank()) {
                val names = apisParam.split(",").map { it.trim() }
                active.filter { names.contains(it.name) }
            } else {
                active
            }

            if (targetApis.isEmpty()) {
                call.respond(HttpStatusCode.NotFound, "No matching providers available")
                return@get
            }

            call.response.headers.append("Content-Type", "text/event-stream; charset=utf-8")
            call.response.headers.append("Cache-Control", "no-cache")
            call.response.headers.append("Connection", "keep-alive")
            call.response.headers.append("Access-Control-Allow-Origin", "*")

            call.respondTextWriter(ContentType.Text.EventStream, HttpStatusCode.OK) {
                val writer = this
                val channel = Channel<SearchStreamEventDTO>(Channel.UNLIMITED)

                coroutineScope {
                    val jobs = targetApis.map { api ->
                        launch(Dispatchers.IO) {
                            try {
                                val results = api.search(query)?.map { it.toDTO() } ?: emptyList()
                                channel.send(SearchStreamEventDTO(apiName = api.name, results = results))
                            } catch (t: Throwable) {
                                channel.send(SearchStreamEventDTO(apiName = api.name, error = t.message))
                            }
                        }
                    }

                    val collectorJob = launch {
                        for (event in channel) {
                            val jsonString = SearchJson.instance.encodeToString(event)
                            writer.write("data: $jsonString\n\n")
                            writer.flush()
                        }
                    }

                    jobs.joinAll()
                    channel.send(SearchStreamEventDTO(apiName = "", isComplete = true))
                    channel.close()
                    collectorJob.join()
                }
            }
        }

        get("/sync") {
            val query = call.request.queryParameters["q"]
            if (query.isNullOrBlank()) {
                call.respond(emptyList<SearchResponseDTO>())
                return@get
            }

            val active = ServerPluginLoader.getActiveProviders()
            val combinedResults = coroutineScope {
                active.map { api ->
                    async(Dispatchers.IO) {
                        try {
                            api.search(query)?.map { it.toDTO() } ?: emptyList()
                        } catch (_: Throwable) {
                            emptyList<SearchResponseDTO>()
                        }
                    }
                }.awaitAll().flatten()
            }

            call.respond(combinedResults)
        }
    }
}
