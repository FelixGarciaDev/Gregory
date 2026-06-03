package com.gregory.consumer

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.Locale
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import retrofit2.Retrofit
import retrofit2.http.GET
import retrofit2.http.Query

private const val DEFAULT_LATITUDE = 10.501362
private const val DEFAULT_LONGITUDE = -66.910064
private const val DEFAULT_RADIUS_KM = 20

@Serializable
private data class SearchResponseDto(
    val query: String = "",
    val items: List<SearchOfferDto> = emptyList()
)

@Serializable
private data class SearchOfferDto(
    val id: String,
    val testName: String,
    val providerName: String,
    val locationName: String = "",
    val address: String = "",
    val priceAmount: Double = 0.0,
    val currencyCode: String = "",
    val distanceKm: Double? = null,
    val isAvailable: Boolean = false,
    val lastVerifiedAt: String? = null,
    val paymentMethods: List<String> = emptyList()
)

private interface GregoryApi {
    @GET("tests/search")
    suspend fun searchTests(
        @Query("q") query: String,
        @Query("lat") latitude: Double = DEFAULT_LATITUDE,
        @Query("lng") longitude: Double = DEFAULT_LONGITUDE,
        @Query("radius_km") radiusKm: Int = DEFAULT_RADIUS_KM
    ): SearchResponseDto
}

private object GregoryApiClient {
    private val json = Json { ignoreUnknownKeys = true }

    @OptIn(ExperimentalSerializationApi::class)
    val service: GregoryApi by lazy {
        Retrofit.Builder()
            .baseUrl(BuildConfig.GREGORY_API_BASE_URL)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(GregoryApi::class.java)
    }
}

private sealed interface SearchUiState {
    data object Home : SearchUiState
    data object Loading : SearchUiState
    data object Empty : SearchUiState
    data class Success(val items: List<SearchOfferDto>) : SearchUiState
    data class Error(val message: String) : SearchUiState
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = Color.White) {
                    SearchScreen()
                }
            }
        }
    }
}

@Composable
private fun SearchScreen() {
    val api = remember { GregoryApiClient.service }
    var query by rememberSaveable { mutableStateOf("") }
    var searchState by remember { mutableStateOf<SearchUiState>(SearchUiState.Home) }

    LaunchedEffect(query) {
        val term = query.trim()
        if (term.isBlank()) {
            searchState = SearchUiState.Home
            return@LaunchedEffect
        }

        delay(450)
        searchState = SearchUiState.Loading

        searchState = try {
            val response = withContext(Dispatchers.IO) {
                api.searchTests(query = term)
            }

            if (response.items.isEmpty()) {
                SearchUiState.Empty
            } else {
                SearchUiState.Success(response.items)
            }
        } catch (_: Exception) {
            SearchUiState.Error("No se pudo conectar con Gregory.")
        }
    }

    Scaffold(
        containerColor = Color.White,
        bottomBar = {
            GregoryBottomBar(
                isHomeSelected = query.isBlank(),
                onHomeClick = {
                    query = ""
                    searchState = SearchUiState.Home
                }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 24.dp, vertical = 28.dp),
            verticalArrangement = Arrangement.spacedBy(22.dp)
        ) {
            Text(
                text = "GREGORY",
                color = Color(0xFF202124),
                fontSize = 42.sp,
                fontWeight = FontWeight.Normal,
                maxLines = 1
            )

            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 64.dp),
                placeholder = { Text("Buscar...") },
                singleLine = true,
                shape = RoundedCornerShape(22.dp),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search)
            )

            ResultsPanel(
                searchState = searchState,
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
            )
        }
    }
}

@Composable
private fun ResultsPanel(searchState: SearchUiState, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(Color(0xFFFAFBFC))
            .border(1.dp, Color(0xFF202124), RoundedCornerShape(8.dp))
            .padding(12.dp)
    ) {
        when (searchState) {
            SearchUiState.Home -> Spacer(modifier = Modifier.fillMaxSize())
            SearchUiState.Loading -> CenteredPanelText("Buscando...")
            SearchUiState.Empty -> CenteredPanelText("Sin resultados")
            is SearchUiState.Error -> CenteredPanelText(searchState.message)
            is SearchUiState.Success -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(searchState.items, key = { it.id }) { offer ->
                        ResultCard(offer)
                    }
                }
            }
        }
    }
}

@Composable
private fun CenteredPanelText(text: String) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(text = text, color = Color(0xFF4B5563), style = MaterialTheme.typography.bodyLarge)
    }
}

@Composable
private fun ResultCard(offer: SearchOfferDto) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Color(0xFFE5E7EB))
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = offer.testName,
                color = Color(0xFF111827),
                style = MaterialTheme.typography.titleMedium,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = listOf(offer.providerName, offer.locationName).filter { it.isNotBlank() }.joinToString(" - "),
                color = Color(0xFF374151),
                style = MaterialTheme.typography.bodyMedium,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            if (offer.address.isNotBlank()) {
                Text(
                    text = offer.address,
                    color = Color(0xFF6B7280),
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(formatPrice(offer), color = Color(0xFF111827), style = MaterialTheme.typography.bodyMedium)
                Text(formatDistance(offer), color = Color(0xFF111827), style = MaterialTheme.typography.bodyMedium)
            }
            Text(
                text = formatVerification(offer),
                color = Color(0xFF6B7280),
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}

@Composable
private fun GregoryBottomBar(isHomeSelected: Boolean, onHomeClick: () -> Unit) {
    NavigationBar(containerColor = Color.White, tonalElevation = 6.dp) {
        NavigationBarItem(
            selected = false,
            onClick = {},
            icon = { Icon(Icons.Outlined.FavoriteBorder, contentDescription = "Favorites") },
            label = { Text("Fav") }
        )
        NavigationBarItem(
            selected = isHomeSelected,
            onClick = onHomeClick,
            icon = { Icon(Icons.Filled.Home, contentDescription = "Home") },
            label = { Text("Home") }
        )
        NavigationBarItem(
            selected = false,
            onClick = {},
            icon = { Icon(Icons.Outlined.Person, contentDescription = "User") },
            label = { Text("User") }
        )
    }
}

private fun formatPrice(offer: SearchOfferDto): String {
    val amount = if (offer.priceAmount % 1.0 == 0.0) {
        offer.priceAmount.toInt().toString()
    } else {
        String.format(Locale.US, "%.2f", offer.priceAmount)
    }

    return listOf(amount, offer.currencyCode).filter { it.isNotBlank() }.joinToString(" ")
}

private fun formatDistance(offer: SearchOfferDto): String {
    return offer.distanceKm?.let { String.format(Locale.US, "%.1f km", it) } ?: "Distancia no disponible"
}

private fun formatVerification(offer: SearchOfferDto): String {
    val status = if (offer.isAvailable) "Disponible" else "No disponible"
    val verifiedAt = offer.lastVerifiedAt?.substringBefore("T")?.takeIf { it.isNotBlank() }

    return if (verifiedAt == null) {
        status
    } else {
        "$status - Verificado $verifiedAt"
    }
}
