<?php
header('Content-Type: application/json');

// Добавим проверку прав
if (!is_writable('hotspotData.js')) {
    http_response_code(500);
    echo json_encode(['error' => 'Нет прав на запись файла']);
    exit;
}

// Получаем данные из POST запроса
$data = json_decode(file_get_contents('php://input'), true);

if ($data) {
    // Формируем содержимое файла
    $fileContent = "export const hotspotData = " . json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . ";";
    
    // Записываем в файл
    if (file_put_contents('hotspotData.js', $fileContent)) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Ошибка при сохранении файла']);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Неверные данные']);
}
?> 