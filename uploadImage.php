<?php
header('Content-Type: application/json');

// Проверяем директорию images
$uploadDir = 'images/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Проверяем права на запись
if (!is_writable($uploadDir)) {
    chmod($uploadDir, 0777);
}

// Добавляем логирование для отладки
error_log("Начало загрузки файла");

if (isset($_FILES['image'])) {
    $file = $_FILES['image'];
    error_log("Получен файл: " . print_r($file, true));
    
    // Проверяем ошибки загрузки
    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Ошибка загрузки файла: ' . $file['error'],
            'details' => error_get_last()
        ]);
        exit;
    }

    $fileName = basename($file['name']);
    $targetPath = $uploadDir . $fileName;

    // Проверяем тип файла
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($file['type'], $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Неподдерживаемый тип файла: ' . $file['type']]);
        exit;
    }

    error_log("Попытка сохранить файл в: " . $targetPath);

    // Перемещаем загруженный файл
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        error_log("Файл успешно сохранен");
        echo json_encode([
            'success' => true,
            'filename' => $fileName,
            'path' => $targetPath
        ]);
    } else {
        error_log("Ошибка при сохранении файла");
        http_response_code(500);
        echo json_encode([
            'error' => 'Ошибка при сохранении файла',
            'details' => error_get_last()
        ]);
    }
} else {
    error_log("Файл не получен в $_FILES");
    http_response_code(400);
    echo json_encode([
        'error' => 'Файл не получен',
        'files' => $_FILES,
        'post' => $_POST
    ]);
}
?> 