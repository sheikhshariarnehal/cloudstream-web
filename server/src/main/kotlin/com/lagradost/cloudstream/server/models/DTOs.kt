package com.lagradost.cloudstream.server.models

import kotlinx.serialization.Serializable

@Serializable
data class SearchResponseDTO(
    val name: String,
    val url: String,
    val apiName: String,
    val type: String? = null,
    val posterUrl: String? = null,
    val year: Int? = null,
    val quality: String? = null,
    val id: Int? = null
)

@Serializable
data class HomePageListDTO(
    val name: String,
    val list: List<SearchResponseDTO>,
    val isHorizontalImages: Boolean = false
)

@Serializable
data class HomePageResponseDTO(
    val apiName: String,
    val shelves: List<HomePageListDTO>
)

@Serializable
data class ActorDTO(
    val name: String,
    val image: String? = null,
    val role: String? = null
)

@Serializable
data class EpisodeDTO(
    val name: String? = null,
    val season: Int? = null,
    val episode: Int? = null,
    val data: String,
    val posterUrl: String? = null,
    val synopsis: String? = null,
    val rating: Int? = null,
    val date: String? = null,
    val isFiller: Boolean = false
)

@Serializable
data class LoadResponseDTO(
    val name: String,
    val url: String,
    val apiName: String,
    val type: String,
    val posterUrl: String? = null,
    val backgroundPosterUrl: String? = null,
    val year: Int? = null,
    val plot: String? = null,
    val rating: Int? = null,
    val tags: List<String> = emptyList(),
    val duration: String? = null,
    val status: String? = null,
    val actors: List<ActorDTO> = emptyList(),
    val episodes: List<EpisodeDTO> = emptyList(),
    val recommendations: List<SearchResponseDTO> = emptyList()
)

@Serializable
data class StreamLinkDTO(
    val name: String,
    val url: String,
    val rawUrl: String,
    val referer: String,
    val quality: Int,
    val isM3u8: Boolean,
    val headers: Map<String, String> = emptyMap()
)

@Serializable
data class SubtitleDTO(
    val id: String? = null,
    val lang: String,
    val url: String,
    val autoSelect: Boolean = false
)

@Serializable
data class LoadLinksResponseDTO(
    val links: List<StreamLinkDTO>,
    val subtitles: List<SubtitleDTO>
)

@Serializable
data class ProviderInfoDTO(
    val name: String,
    val mainUrl: String,
    val supportedTypes: List<String>,
    val hasMainPage: Boolean,
    val hasQuickSearch: Boolean,
    val lang: String,
    val iconUrl: String? = null,
    val isBuiltIn: Boolean = false,
    val isEnabled: Boolean = true
)

@Serializable
data class SearchStreamEventDTO(
    val apiName: String,
    val results: List<SearchResponseDTO> = emptyList(),
    val isComplete: Boolean = false,
    val error: String? = null
)

@Serializable
data class AniSkipResponseDTO(
    val found: Boolean,
    val opStart: Double? = null,
    val opEnd: Double? = null,
    val edStart: Double? = null,
    val edEnd: Double? = null
)
