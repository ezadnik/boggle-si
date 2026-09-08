package com.slovenian.boggle

import android.os.Bundle
import android.os.CountDownTimer
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.PointerInputChange
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.abs
import kotlin.random.Random

class MainActivity : ComponentActivity() {
    private lateinit var soundManager: SoundManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        SlovenianDictionary.load(this)
        soundManager = SoundManager(this)

        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF0F172A) // Sleek Modern Dark Navy
                ) {
                    BoggleSlovenianScreen(soundManager = soundManager)
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        soundManager.release()
    }
}

// Data class representation of found words
data class PlayerWord(
    val id: String,
    val word: String,
    val points: Int,
    val isValid: Boolean,
    val definition: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BoggleSlovenianScreen(soundManager: SoundManager) {
    val coroutineScope = rememberCoroutineScope()

    // Configuration States
    var selectedDurationMinutes by remember { mutableStateOf(3) } // 3, 4, 5 mins
    val secondsTotal = selectedDurationMinutes * 60
    var timeLeftSeconds by remember { mutableStateOf(secondsTotal) }
    var gameStatus by remember { mutableStateOf("idle") } // idle, shaking, playing, ended

    // Seeded Random states for Synchronized Multiplayer
    var seedInput by remember { mutableStateOf("") }
    var activeSeed by remember { mutableStateOf(1234L) }
    
    // Grid generation matching Slovenian dice exactly
    var boardGrid by remember { mutableStateOf(SlovenianDictionary.generateBoard(activeSeed)) }
    
    // Grid coordinate highlight path
    var selectedPath by remember { mutableStateOf<List<Pair<Int, Int>>>(emptyList()) }
    var isDragging by remember { mutableStateOf(false) }

    // List of found entries
    var foundWordsList by remember { mutableStateOf<List<PlayerWord>>(emptyList()) }

    // Timer control object
    var countDownTimer: CountDownTimer? by remember { mutableStateOf(null) }

    // Grid Shaking Animations
    val infiniteTransition = rememberInfiniteTransition(label = "shake")
    val shakeOffset by infiniteTransition.animateFloat(
        initialValue = -12f,
        targetValue = 12f,
        animationSpec = infiniteRepeatable(
            animation = tween(45, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "shake_anim"
    )

    // Layout boundaries of cubes inside grid to support seamless continuous drag gestures
    val cubeBounds = remember { mutableStateMapOf<String, Pair<Offset, IntSize>>() }

    // Derive current spelled preview text in real-time
    val currentWordPreview = remember(selectedPath, boardGrid) {
        selectedPath.map { boardGrid[it.first][it.second] }.joinToString("")
    }

    // Helper to evaluate grid adjacency
    fun isAdjacent(p1: Pair<Int, Int>, p2: Pair<Int, Int>): Boolean {
        val dr = abs(p1.first - p2.first)
        val dc = abs(p1.second - p2.second)
        return dr <= 1 && dc <= 1 && !(dr == 0 && dc == 0)
    }

    // Core rolling routine including sound effects/timings
    fun startDiceRolling(seed: Long) {
        if (gameStatus == "shaking") return
        
        // Stop any old timer running
        countDownTimer?.cancel()
        
        activeSeed = seed
        gameStatus = "shaking"
        selectedPath = emptyList()
        foundWordsList = emptyList()
        soundManager.startRattleLoop()

        // Launch rattling loops
        coroutineScope.launch {
            var rattleTicks = 0
            while (rattleTicks < 15) {
                // Dynamically randomize board letters in real-time during physical rattle
                boardGrid = SlovenianDictionary.generateBoard(Random.nextLong(1000L, 9999L))
                delay(150L)
                rattleTicks++
            }
            
            // Finish shaking
            soundManager.stopRattleLoop()
            boardGrid = SlovenianDictionary.generateBoard(activeSeed)
            timeLeftSeconds = secondsTotal
            gameStatus = "playing"
            
            // Set Android CountDown Timer
            countDownTimer = object : CountDownTimer((timeLeftSeconds * 1000).toLong(), 1000L) {
                override fun onTick(millisUntilFinished: Long) {
                    timeLeftSeconds = (millisUntilFinished / 1000L).toInt()
                }

                override fun onFinish() {
                    timeLeftSeconds = 0
                    gameStatus = "ended"
                    soundManager.playBuzzer()
                }
            }.start()
        }
    }

    // Submit Action Validation
    fun checkAndSubmitWord() {
        if (currentWordPreview.length < 3) return
        val wordToCheck = currentWordPreview.uppercase()

        // Avoid entering duplicate found words
        if (foundWordsList.any { it.word == wordToCheck }) {
            selectedPath = emptyList()
            return
        }

        // Validate Word against Local Lemmas
        val checkResult = SlovenianDictionary.verifySlovenianWord(wordToCheck)
        
        if (checkResult.isValid) {
            soundManager.playSuccess()
        }

        val newWord = PlayerWord(
            id = System.currentTimeMillis().toString(),
            word = wordToCheck,
            points = checkResult.points,
            isValid = checkResult.isValid,
            definition = checkResult.definition
        )

        foundWordsList = listOf(newWord) + foundWordsList
        selectedPath = emptyList()
    }

    val totalPoints = remember(foundWordsList) {
        foundWordsList.filter { it.isValid }.sumOf { it.points }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        
        // --- TOP PORTRAIT CONTENT: Animated Hourglass & Room Code Multiplayer ---
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
            shape = RoundedCornerShape(20.dp),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, Color(0xFF334159), RoundedCornerShape(20.dp))
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Hourglass Graphic Element
                Box(
                    modifier = Modifier
                        .size(100.dp)
                        .padding(2.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        HourglassCanvas(
                            ratioRemaining = timeLeftSeconds.toFloat() / secondsTotal.toFloat(),
                            isActive = gameStatus == "playing",
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxWidth()
                        )
                        
                        // Digital Clock Display
                        val displayedTime = String.format("%d:%02d", timeLeftSeconds / 60, timeLeftSeconds % 60)
                        Text(
                            text = displayedTime,
                            color = Color(0xFFFFD54F),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }
                }

                // Multiplayer Seed Column
                Column(
                    modifier = Modifier.weight(1f),
                    horizontalAlignment = Alignment.End,
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = "Koda igre (Host):",
                        color = Color.LightGray,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    
                    Box(
                        modifier = Modifier
                            .background(Color(0xFF0F172A), RoundedCornerShape(10.dp))
                            .border(1.dp, Color(0xFF334159), RoundedCornerShape(10.dp))
                            .padding(horizontal = 14.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = activeSeed.toString(),
                            color = Color(0xFFFFB300),
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace
                        )
                    }

                    // Guest Room Code Input
                    Row(
                        modifier = Modifier
                            .fillMaxWidth(0.95f)
                            .padding(top = 2.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.End
                    ) {
                        TextField(
                            value = seedInput,
                            onValueChange = { input -> seedInput = input.filter { it.isDigit() }.take(4) },
                            placeholder = { Text("Šifra", fontSize = 10.sp, color = Color.Gray) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            colors = TextFieldDefaults.colors(
                                focusedContainerColor = Color(0xFF0F172A),
                                unfocusedContainerColor = Color(0xFF0F172A),
                                disabledContainerColor = Color(0xFF0F172A),
                                focusedIndicatorColor = Color.Transparent,
                                unfocusedIndicatorColor = Color.Transparent
                            ),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .width(70.dp)
                                .height(34.dp)
                                .border(1.dp, Color(0xFF2E3B52), RoundedCornerShape(8.dp)),
                            textStyle = LocalTextStyle.current.copy(
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black,
                                textAlign = TextAlign.Center,
                                color = Color.White,
                                fontFamily = FontFamily.Monospace
                            )
                        )
                        
                        Spacer(modifier = Modifier.width(4.dp))
                        
                        Button(
                            onClick = {
                                val parsed = seedInput.toLongOrNull()
                                if (parsed != null && parsed in 1000..9999) {
                                    startDiceRolling(parsed)
                                }
                            },
                            enabled = seedInput.length == 4,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFFFFB300),
                                contentColor = Color.Black
                            ),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(0.dp),
                            modifier = Modifier
                                .height(34.dp)
                                .width(64.dp)
                        ) {
                            Text("Pridruži se", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                        }
                    }
                }
            }

            // Quick Timer Controls inside top bar background
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF152033))
                    .padding(horizontal = 14.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Čas runde:", color = Color.Gray, fontSize = 11.sp)
                
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    listOf(3, 4, 5).forEach { min ->
                        AssistChip(
                            onClick = {
                                selectedDurationMinutes = min
                                if (gameStatus == "idle") {
                                    timeLeftSeconds = min * 60
                                }
                            },
                            label = { Text("${min}m", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White) },
                            colors = AssistChipDefaults.assistChipColors(
                                containerColor = if (selectedDurationMinutes == min) Color(0xFFFFB300) else Color(0xFF26324D)
                            )
                        )
                    }
                }
            }
        }

        // --- CENTER SECTION: Massive 5x5 Grid Board (95% Screen Width) ---
        Box(
            modifier = Modifier
                .fillMaxWidth(0.97f)
                .aspectRatio(1f)
                .graphicsLayer {
                    // Inject active shaking animations when shuffling
                    if (gameStatus == "shaking") {
                        translationX = shakeOffset
                        translationY = shakeOffset * 0.7f
                        rotationZ = shakeOffset * 0.1f
                    }
                }
                .background(Color(0xFF1E293B), RoundedCornerShape(24.dp))
                .border(2.dp, Color(0xFF334155), RoundedCornerShape(24.dp))
                .padding(10.dp)
                // Capture gestures tracing over grids
                .pointerInput(Unit) {
                    detectDragGestures(
                        onDragStart = { offset ->
                            if (gameStatus == "playing") {
                                isDragging = true
                                // Find cell mapping matching drag start
                                val cellKey = findCubeByOffset(offset, cubeBounds)
                                if (cellKey != null) {
                                    selectedPath = listOf(cellKey)
                                }
                            }
                        },
                        onDragEnd = { isDragging = false },
                        onDragCancel = { isDragging = false },
                        onDrag = { change: PointerInputChange, _ ->
                            if (gameStatus == "playing" && isDragging) {
                                val cellKey = findCubeByOffset(change.position, cubeBounds)
                                if (cellKey != null) {
                                    val lastCell = selectedPath.lastOrNull()
                                    if (lastCell == null) {
                                        selectedPath = listOf(cellKey)
                                    } else if (cellKey != lastCell) {
                                        // Undo back-track gestures
                                        if (selectedPath.size >= 2 && cellKey == selectedPath[selectedPath.size - 2]) {
                                            selectedPath = selectedPath.dropLast(1)
                                        } else if (!selectedPath.contains(cellKey) && isAdjacent(lastCell, cellKey)) {
                                            selectedPath = selectedPath + cellKey
                                        }
                                    }
                                }
                            }
                        }
                    )
                },
            contentAlignment = Alignment.Center
        ) {
            
            // Draw connector vector paths under letters layer
            Canvas(modifier = Modifier.fillMaxSize()) {
                if (selectedPath.size >= 2) {
                    val path = Path()
                    selectedPath.forEachIndexed { idx, pair ->
                        val cellCoords = cubeBounds["${pair.first},${pair.second}"]
                        if (cellCoords != null) {
                            val centerX = cellCoords.first.x + cellCoords.second.width / 2f
                            val centerY = cellCoords.first.y + cellCoords.second.height / 2f
                            if (idx == 0) {
                                path.moveTo(centerX, centerY)
                            } else {
                                path.lineTo(centerX, centerY)
                            }
                        }
                    }
                    drawPath(
                        path = path,
                        color = Color(0xFFFFB300),
                        alpha = 0.65f,
                        style = Stroke(width = 16f, miter = 1f)
                    )
                }
            }

            // Grid items layout
            LazyVerticalGrid(
                columns = GridCells.Fixed(5),
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(6.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                userScrollEnabled = false
            ) {
                items(25) { idx ->
                    val row = idx / 5
                    val col = idx % 5
                    val isSelected = selectedPath.contains(Pair(row, col))
                    val letter = boardGrid[row][col]

                    Box(
                        modifier = Modifier
                            .aspectRatio(1f)
                            .onGloballyPositioned { layoutCoordinates ->
                                cubeBounds["$row,$col"] = Pair(
                                    layoutCoordinates.positionInWindow(),
                                    layoutCoordinates.size
                                )
                            }
                            .background(
                                color = when {
                                    isSelected -> Color(0xFFFFC107) // Selected Golden yellow
                                    else -> Color(0xFFF1F5F9) // Clean White background
                                },
                                shape = RoundedCornerShape(12.dp)
                            )
                            // Support pure click selection
                            .clickable {
                                if (gameStatus == "playing") {
                                    val cell = Pair(row, col)
                                    val last = selectedPath.lastOrNull()
                                    if (selectedPath.contains(cell)) {
                                        if (last == cell) {
                                            selectedPath = selectedPath.dropLast(1)
                                        } else {
                                            val cIdx = selectedPath.indexOf(cell)
                                            selectedPath = selectedPath.take(cIdx + 1)
                                        }
                                    } else {
                                        if (last == null || isAdjacent(last, cell)) {
                                            selectedPath = selectedPath + cell
                                        }
                                    }
                                }
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        // Massive letters strictly BLACK, centered, twice larger
                        Text(
                            text = letter.toString(),
                            fontSize = 32.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.Black, // STRICTLY BLACK
                            textAlign = TextAlign.Center
                        )

                        // Micro order index indicator
                        if (isSelected) {
                            val traceIndex = selectedPath.indexOf(Pair(row, col)) + 1
                            Box(
                                modifier = Modifier
                                    .align(Alignment.BottomEnd)
                                    .padding(bottom = 2.dp, end = 4.dp)
                            ) {
                                Text(
                                    text = traceIndex.toString(),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF1E293B)
                                )
                            }
                        }
                    }
                }
            }
        }

        // --- BOTTOM SECTION: Word Preview, Control Buttons, and Validations --
        
        // Spelled Word Preview Banner
        Box(
            modifier = Modifier
                .fillMaxWidth(0.97f)
                .height(44.dp)
                .background(Color(0xFF0F172A), RoundedCornerShape(12.dp))
                .border(1.dp, Color(0xFF334155), RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center
        ) {
            if (currentWordPreview.isNotEmpty()) {
                Text(
                    text = currentWordPreview.uppercase(),
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 2.sp
                )
            } else {
                Text(
                    text = "Klikni ali povleci prst prek črk",
                    color = Color.Gray,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.SansSerif
                )
            }
        }

        // Vertical buttons Počisti and Oddaj alongside primary trigger
        Row(
            modifier = Modifier.fillMaxWidth(0.97f),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { selectedPath = emptyList() },
                enabled = selectedPath.isNotEmpty() && gameStatus == "playing",
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF334155),
                    disabledContainerColor = Color(0xFF1E293B)
                ),
                modifier = Modifier.weight(1f)
            ) {
                Text("Počisti", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
            }

            Button(
                onClick = { checkAndSubmitWord() },
                enabled = currentWordPreview.length >= 3 && gameStatus == "playing",
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFFFFB300),
                    disabledContainerColor = Color(0xFF262C38)
                ),
                modifier = Modifier.weight(1.2f)
            ) {
                Text("Oddaj", fontSize = 13.sp, fontWeight = FontWeight.Black, color = Color.Black)
            }
        }

        // Main game shaker control
        Button(
            onClick = {
                val nextSeed = Random.nextLong(1000L, 9999L)
                startDiceRolling(nextSeed)
            },
            enabled = gameStatus != "shaking",
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
            modifier = Modifier.fillMaxWidth(0.97f).height(46.dp)
        ) {
            Text("PREMEŠAJ IN ZAČNI", fontSize = 13.sp, fontWeight = FontWeight.Black)
        }

        // Vertically scrollable "NAJDENE BESEDE" List (Bottom section)
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF152033)),
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .border(1.dp, Color(0xFF223047), RoundedCornerShape(18.dp))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "NAJDENE BESEDE (${foundWordsList.size})",
                        color = Color.LightGray,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp
                    )

                    Row(
                        modifier = Modifier
                            .background(Color(0xFF0F172A), RoundedCornerShape(8.dp))
                            .padding(horizontal = 10.dp, vertical = 3.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("TOČKE: ", fontSize = 10.sp, color = Color.Gray)
                        Text(
                            text = totalPoints.toString(),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFFFFB300),
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }

                HorizontalDivider(color = Color(0xFF223047), modifier = Modifier.padding(vertical = 8.dp))

                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    if (foundWordsList.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 24.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "Brez besed. Poveži vsaj 3 sosednje črke!",
                                    color = Color.Gray,
                                    fontSize = 11.sp,
                                    fontFamily = FontFamily.SansSerif
                                )
                            }
                        }
                    } else {
                        items(foundWordsList) { item ->
                            val textColor = if (item.isValid) Color.White else Color(0x80EF4444)
                            val wordDecoration = if (item.isValid) TextDecoration.None else TextDecoration.LineThrough
                            
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(
                                        color = if (item.isValid) Color(0xFF1E293B) else Color(0xFF2E1C1C),
                                        shape = RoundedCornerShape(8.dp)
                                    )
                                    .border(
                                        width = 1.dp,
                                        color = if (item.isValid) Color(0xFF334155) else Color(0xFF4A1E1E),
                                        shape = RoundedCornerShape(8.dp)
                                    )
                                    .padding(horizontal = 10.dp, vertical = 8.dp)
                            ) {
                                Column {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = item.word,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Black,
                                            color = textColor,
                                            fontFamily = FontFamily.Monospace,
                                            textDecoration = wordDecoration
                                        )

                                        Text(
                                            text = if (item.isValid) "+${item.points} točk" else "0 točk (Neveljavno)",
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (item.isValid) Color(0xFF4ADE80) else Color(0xFFF87171)
                                        )
                                    }
                                    
                                    Text(
                                        text = item.definition,
                                        fontSize = 10.sp,
                                        color = Color.LightGray,
                                        modifier = Modifier.padding(top = 2.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// Map screen coordinate drags into discrete cell indexes on the 5x5 grid
fun findCubeByOffset(
    pointerOffset: Offset,
    bounds: Map<String, Pair<Offset, IntSize>>
): Pair<Int, Int>? {
    bounds.forEach { (key, pair) ->
        val startOffset = pair.first
        val size = pair.second
        val endX = startOffset.x + size.width
        val endY = startOffset.y + size.height
        
        if (pointerOffset.x >= startOffset.x && pointerOffset.x <= endX &&
            pointerOffset.y >= startOffset.y && pointerOffset.y <= endY
        ) {
            val parts = key.split(",")
            if (parts.size == 2) {
                return Pair(parts[0].toInt(), parts[1].toInt())
            }
        }
    }
    return null
}

// Animated Hourglass graphic render loop
@Composable
fun HourglassCanvas(
    ratioRemaining: Float,
    isActive: Boolean,
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier) {
        val midX = size.width / 2f
        val midY = size.height / 2f
        
        val width = 44.dp.toPx()
        val height = 64.dp.toPx()
        
        // Boundaries
        val topPlateY = midY - height / 2f
        val bottomPlateY = midY + height / 2f
        
        // Draw wood frames caps
        drawLine(Color(0xFF8A7A5F), Offset(midX - width / 1.5f, topPlateY), Offset(midX + width / 1.5f, topPlateY), strokeWidth = 8f)
        drawLine(Color(0xFF8A7A5F), Offset(midX - width / 1.5f, bottomPlateY), Offset(midX + width / 1.5f, bottomPlateY), strokeWidth = 8f)
        
        // Left - Right supports pillars
        drawLine(Color(0xFF6B5B3E), Offset(midX - width / 1.4f, topPlateY), Offset(midX - width / 1.4f, bottomPlateY), strokeWidth = 5f)
        drawLine(Color(0xFF6B5B3E), Offset(midX + width / 1.4f, topPlateY), Offset(midX + width / 1.4f, bottomPlateY), strokeWidth = 5f)

        // Draw top glass bulb shape
        val topGlassPath = Path().apply {
            moveTo(midX - width / 2f, topPlateY + 4f)
            lineTo(midX + width / 2f, topPlateY + 4f)
            quadraticBezierTo(midX + width / 2f, midY - height / 6f, midX + 3f, midY - 2f)
            lineTo(midX - 3f, midY - 2f)
            quadraticBezierTo(midX - width / 2f, midY - height / 6f, midX - width / 2f, topPlateY + 4f)
        }
        drawPath(topGlassPath, Color(0x33FFFFFF))

        // Draw bottom glass bulb shape
        val bottomGlassPath = Path().apply {
            moveTo(midX - 3f, midY + 2f)
            lineTo(midX + 3f, midY + 2f)
            quadraticBezierTo(midX + width / 2f, midY + height / 6f, midX + width / 2f, bottomPlateY - 4f)
            lineTo(midX - width / 2f, bottomPlateY - 4f)
            quadraticBezierTo(midX - width / 2f, midY + height / 6f, midX - 3f, midY + 2f)
        }
        drawPath(bottomGlassPath, Color(0x33FFFFFF))

        // Draw remaining top sand pile
        if (ratioRemaining > 0f) {
            val topSandHeight = (height / 2f - 6f) * ratioRemaining
            val sandLevelY = midY - 3f - topSandHeight
            val sandWidth = (width / 2.2f) * ratioRemaining
            val sandPath = Path().apply {
                moveTo(midX - sandWidth, sandLevelY)
                lineTo(midX + sandWidth, sandLevelY)
                quadraticBezierTo(midX + 3f, midY - 2f, midX + 2f, midY - 2f)
                lineTo(midX - 2f, midY - 2f)
                quadraticBezierTo(midX - 3f, midY - 2f, midX - sandWidth, sandLevelY)
            }
            drawPath(sandPath, Color(0xFFFFC107))
        }

        // Draw accumulated bottom sand pile
        val ratioPassed = 1f - ratioRemaining
        if (ratioPassed > 0f) {
            val bottomSandHeight = (height / 2.2f) * ratioPassed
            val bottomSandPath = Path().apply {
                moveTo(midX - width / 2f + 4f, bottomPlateY - 4f)
                lineTo(midX + width / 2f - 4f, bottomPlateY - 4f)
                quadraticBezierTo(midX + width / 3.5f, bottomPlateY - bottomSandHeight, midX, bottomPlateY - bottomSandHeight)
                quadraticBezierTo(midX - width / 3.5f, bottomPlateY - bottomSandHeight, midX - width / 2f + 4f, bottomPlateY - 4f)
            }
            drawPath(bottomSandPath, Color(0xFFFFC107))
        }

        // Animated Central falling sand stream
        if (isActive && ratioRemaining > 0f) {
            drawLine(
                color = Color(0xFFFFC107),
                start = Offset(midX, midY - 2f),
                end = Offset(midX, bottomPlateY - 4f - (height / 2.2f) * ratioPassed),
                strokeWidth = 3f
            )
        }
    }
}
