package com.lagradost.cloudstream.server.routes

import com.lagradost.cloudstream.server.models.*
import com.lagradost.cloudstream.server.plugins.ServerPluginLoader
import com.lagradost.cloudstream3.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun SearchResponse.toDTO(): SearchResponseDTO {
    val yearVal = (this as? MovieSearchResponse)?.year
        ?: (this as? AnimeSearchResponse)?.year
        ?: (this as? TvSeriesSearchResponse)?.year
    return SearchResponseDTO(
        name = this.name,
        url = this.url,
        apiName = this.apiName,
        type = this.type?.name,
        posterUrl = this.posterUrl,
        year = yearVal,
        quality = this.quality?.name,
        id = this.id
    )
}

fun Route.catalogRoutes() {
    route("/api") {

        get("/providers") {
            val all = ServerPluginLoader.getAllProviders()
            val list = all.map { api ->
                ProviderInfoDTO(
                    name = api.name,
                    mainUrl = api.mainUrl,
                    supportedTypes = api.supportedTypes.map { it.name },
                    hasMainPage = api.hasMainPage,
                    hasQuickSearch = api.hasQuickSearch,
                    lang = api.lang,
                    iconUrl = null,
                    isBuiltIn = true,
                    isEnabled = ServerPluginLoader.isProviderEnabled(api.name)
                )
            }
            call.respond(list)
        }

        get("/home") {
            val apiParam = call.request.queryParameters["api"]
            val pageParam = call.request.queryParameters["page"]?.toIntOrNull() ?: 1

            val activeProviders = ServerPluginLoader.getActiveProviders()
            val targetApi = if (!apiParam.isNullOrBlank()) {
                ServerPluginLoader.getProvider(apiParam)
            } else {
                activeProviders.firstOrNull { it.hasMainPage } ?: activeProviders.firstOrNull()
            }

            if (targetApi == null) {
                call.respond(HttpStatusCode.NotFound, "No active provider found with home page capability")
                return@get
            }

            try {
                val shelves = mutableListOf<HomePageListDTO>()
                val requests = targetApi.mainPage.ifEmpty {
                    listOf(MainPageData(name = targetApi.name, data = targetApi.mainUrl))
                }

                for (pageData in requests) {
                    try {
                        val req = MainPageRequest(pageData.name, pageData.data, false)
                        val homeResponse = targetApi.getMainPage(pageParam, req)
                        homeResponse?.items?.forEach { shelf ->
                            shelves.add(
                                HomePageListDTO(
                                    name = shelf.name.ifBlank { pageData.name },
                                    list = shelf.list.map { it.toDTO() },
                                    isHorizontalImages = shelf.isHorizontalImages
                                )
                            )
                        }
                    } catch (_: Throwable) {}
                }

                call.respond(HomePageResponseDTO(apiName = targetApi.name, shelves = shelves))
            } catch (t: Throwable) {
                call.respond(HttpStatusCode.InternalServerError, "Failed loading home page from ${targetApi.name}: ${t.message}")
            }
        }

        get("/quicksearch") {
            val query = call.request.queryParameters["q"]
            if (query.isNullOrBlank()) {
                call.respond(emptyList<SearchResponseDTO>())
                return@get
            }

            val apiParam = call.request.queryParameters["api"]
            val targetApi = if (!apiParam.isNullOrBlank()) {
                ServerPluginLoader.getProvider(apiParam)
            } else {
                ServerPluginLoader.getActiveProviders().firstOrNull { it.hasQuickSearch }
                    ?: ServerPluginLoader.getActiveProviders().firstOrNull()
            }

            if (targetApi == null) {
                call.respond(emptyList<SearchResponseDTO>())
                return@get
            }

            try {
                val results = targetApi.quickSearch(query)?.map { it.toDTO() } ?: emptyList()
                call.respond(results)
            } catch (e: Exception) {
                call.respond(emptyList<SearchResponseDTO>())
            }
        }
    }
}
