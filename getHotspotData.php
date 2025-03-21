<?php
header('Content-Type: application/json');

// Путь к файлу с данными
$filePath = 'js/hotspotData.js';

if (file_exists($filePath)) {
    // Читаем содержимое файла
    $content = file_get_contents($filePath);
    
    // Удаляем 'export const hotspotData = ' и ';' из содержимого
    $content = preg_replace('/^export\s+const\s+hotspotData\s+=\s+/', '', $content);
    $content = rtrim($content, ';');
    
    // Если файл пустой или содержит только []
    if (empty($content) || trim($content) === '[]') {
        echo json_encode([]);
        exit;
    }
    
    // Проверяем, что контент является валидным JSON
    $data = json_decode($content);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo $content;
    } else {
        error_log("JSON Error: " . json_last_error_msg());
        echo json_encode([]);
    }
} else {
    // Создаем файл с пустым массивом, если он не существует
    $initialContent = "export const hotspotData = [];\n";
    file_put_contents($filePath, $initialContent);
    echo json_encode([]);
}
?> 