package com.gregory.consumer

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

private val sampleResults = listOf(
    SearchResult(
        testName = "Complete Blood Count (CBC)",
        providerName = "Laboratorio Centro Caracas",
        price = "$12 USD",
        distance = "2.1 km",
        lastVerified = "Verified today"
    ),
    SearchResult(
        testName = "Glucosa Basal",
        providerName = "Clinica Santa Maria",
        price = "$8 USD",
        distance = "3.4 km",
        lastVerified = "Verified today"
    )
)

data class SearchResult(
    val testName: String,
    val providerName: String,
    val price: String,
    val distance: String,
    val lastVerified: String
)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    SearchScreen()
                }
            }
        }
    }
}

@Composable
private fun SearchScreen() {
    var query by rememberSaveable { mutableStateOf("cbc") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Gregory",
            style = MaterialTheme.typography.headlineMedium
        )
        Text(
            text = "Find where a medical test is available and compare prices.",
            style = MaterialTheme.typography.bodyLarge
        )
        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Search tests") }
        )

        sampleResults
            .filter {
                val term = query.trim().lowercase()
                if (term.isBlank()) true
                else "${it.testName} ${it.providerName}".lowercase().contains(term)
            }
            .forEach { result ->
                ResultCard(result)
            }
    }
}

@Composable
private fun ResultCard(result: SearchResult) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(result.testName, style = MaterialTheme.typography.titleMedium)
            Text(result.providerName, style = MaterialTheme.typography.bodyMedium)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(result.price)
                Text(result.distance)
            }
            Text(result.lastVerified, style = MaterialTheme.typography.bodySmall)
        }
    }
}

