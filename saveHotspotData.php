<?php
header('Content-Type: application/json');

// Включаем отображение ошибок для отладки
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Получаем данные из POST запроса
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if ($data === null) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Неверный формат JSON',
        'received_data' => $input,
        'json_error' => json_last_error_msg()
    ]);
    exit;
}

// Путь к файлу
$filePath = 'js/hotspotData.js';

// Проверяем существование директории
$dir = dirname($filePath);
if (!file_exists($dir)) {
    if (!mkdir($dir, 0777, true)) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Не удалось создать директорию',
            'dir' => $dir
        ]);
        exit;
    }
}

// Проверяем и устанавливаем права на директорию
if (!is_writable($dir)) {
    chmod($dir, 0777);
    if (!is_writable($dir)) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Нет прав на запись в директорию',
            'dir' => $dir
        ]);
        exit;
    }
}

// Форматируем данные в JavaScript формат
$jsContent = "export const hotspotData = " . json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . ";\n";

// Сохраняем файл
$result = file_put_contents($filePath, $jsContent);

if ($result !== false) {
    // Проверяем, что файл действительно создался и содержит данные
    if (file_exists($filePath) && filesize($filePath) > 0) {
        // Очищаем кэш opcache, если он включен
        if (function_exists('opcache_invalidate')) {
            opcache_invalidate($filePath, true);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Данные успешно сохранены',
            'bytes_written' => $result,
            'file_path' => $filePath,
            'file_exists' => true,
            'file_size' => filesize($filePath)
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'error' => 'Файл не был создан или пуст',
            'file_path' => $filePath,
            'file_exists' => file_exists($filePath),
            'file_size' => file_exists($filePath) ? filesize($filePath) : 0
        ]);
    }
} else {
    $error = error_get_last();
    http_response_code(500);
    echo json_encode([
        'error' => 'Ошибка при сохранении файла',
        'details' => $error,
        'file_path' => $filePath,
        'is_writable' => is_writable($filePath),
        'dir_writable' => is_writable($dir)
    ]);
}
?> 