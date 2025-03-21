let globalKrpano = null;
let isSelectingLocation = false;
let selectedCoordinates = null;
let isDragging = false;
let touchStartTime = 0;
let touchStartPosition = { x: 0, y: 0 };
let quill; // объявляем редактор глобально

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  // Инициализация панорамы
  embedpano({
    xml: "pano.xml",
    target: "pano",
    html5: "only",
    consolelog: true,
    onready: function (krpano) {
      console.log("krpano загружен и готов");
      globalKrpano = krpano;
    },
    onerror: function (message) {
      console.error("Ошибка загрузки krpano:", message);
    },
  });

  const addHeroButton = document.querySelector(".add-hero-button");
  const instructionText = document.getElementById("instructionText");
  const heroFormModal = document.getElementById("heroFormModal");
  const cancelForm = document.getElementById("cancelForm");
  const heroForm = document.getElementById("heroForm");

  const panoElement = document.getElementById("pano");

  // Desktop события
  panoElement.addEventListener("mousedown", () => {
    isDragging = false;
  });

  panoElement.addEventListener("mousemove", () => {
    isDragging = true;
  });

  panoElement.addEventListener("mouseup", (event) => {
    if (!isDragging && isSelectingLocation) {
      handlePanoClick(event);
    }
  });

  // Мобильные события
  panoElement.addEventListener("touchstart", (event) => {
    isDragging = false;
    touchStartTime = Date.now();
    touchStartPosition = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  });

  panoElement.addEventListener("touchmove", (event) => {
    if (!touchStartPosition) return;

    const touch = event.touches[0];
    const moveX = Math.abs(touch.clientX - touchStartPosition.x);
    const moveY = Math.abs(touch.clientY - touchStartPosition.y);

    // Если движение больше 10px, считаем это перемещением
    if (moveX > 10 || moveY > 10) {
      isDragging = true;
    }
  });

  panoElement.addEventListener("touchend", (event) => {
    const touchDuration = Date.now() - touchStartTime;

    // Проверяем, что это был короткий тап (менее 200мс) и не было перемещения
    if (!isDragging && touchDuration < 200 && isSelectingLocation) {
      handlePanoClick(event);
    }

    // Сбрасываем значения
    touchStartPosition = null;
    touchStartTime = 0;
  });

  // Предотвращаем зум двойным тапом на мобильных устройствах
  panoElement.addEventListener(
    "touchend",
    (event) => {
      event.preventDefault();
    },
    { passive: false }
  );

  // Обработчик клика на кнопку "Добавить героя/Отмена"
  addHeroButton.addEventListener("click", () => {
    if (!isSelectingLocation) {
      // Включаем режим выбора точки
      isSelectingLocation = true;
      instructionText.style.display = "block";
      addHeroButton.textContent = "Отмена";
      addHeroButton.classList.add("cancel");
    } else {
      // Отменяем выбор точки
      isSelectingLocation = false;
      instructionText.style.display = "none";
      addHeroButton.textContent = "Добавить героя";
      addHeroButton.classList.remove("cancel");
    }
  });

  // Функция получения координат при клике на панораму
  function handlePanoClick(event) {
    if (!globalKrpano || !isSelectingLocation) return;

    let mouseX = globalKrpano.get("mouse.x");
    let mouseY = globalKrpano.get("mouse.y");
    let result = globalKrpano.screentosphere(mouseX, mouseY);

    if (result && !isNaN(result.x) && !isNaN(result.y)) {
      selectedCoordinates = {
        ath: result.x.toFixed(4),
        atv: result.y.toFixed(4),
      };

      console.log("Координаты для маркера:");
      console.log("ath =", selectedCoordinates.ath);
      console.log("atv =", selectedCoordinates.atv);

      // Заполняем координаты в форме
      document.getElementById("athValue").textContent = selectedCoordinates.ath;
      document.getElementById("atvValue").textContent = selectedCoordinates.atv;

      // Скрываем инструкцию и возвращаем кнопку в исходное состояние
      instructionText.style.display = "none";
      addHeroButton.textContent = "Добавить героя";
      addHeroButton.classList.remove("cancel");

      // Показываем модальное окно с формой
      heroFormModal.classList.add("active");

      // Отключаем режим выбора точки
      isSelectingLocation = false;
    }
  }

  // Обработчики кнопок "Отмена"
  cancelForm.addEventListener("click", () => {
    heroFormModal.classList.remove("active");
    selectedCoordinates = null; // Сбрасываем координаты при отмене
  });

  // Инициализируем Quill редактор
  quill = new Quill("#editor-container", {
    theme: "snow",
    placeholder: "Введите описание героя...",
    modules: {
      toolbar: [
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["clean"],
      ],
    },
  });

  // Добавим обработчик предпросмотра изображения
  document.getElementById("heroImage").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const preview = document.querySelector(".image-preview");
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
      };
      reader.readAsDataURL(file);
    }
  });

  // Добавим обработчик добавления полей для видео
  document.getElementById("addVideoBtn").addEventListener("click", function () {
    const videoInputs = document.querySelector(".video-inputs");
    const newInput = document.createElement("div");
    newInput.className = "video-input";
    newInput.innerHTML = `
      <input type="url" class="video-url" placeholder="Ссылка на видео">
      <button type="button" class="remove-video-btn">×</button>
    `;
    videoInputs.appendChild(newInput);

    // Добавляем обработчик удаления поля
    newInput
      .querySelector(".remove-video-btn")
      .addEventListener("click", function () {
        newInput.remove();
      });
  });

  // Функция для получения существующих данных
  async function getExistingData() {
    const response = await fetch("getHotspotData.php");
    const text = await response.text();
    console.log("Полученные данные (raw):", text);

    try {
      const data = JSON.parse(text);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Ошибка парсинга JSON:", e);
      return [];
    }
  }

  // Обновим обработчик отправки формы
  heroForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      // Получаем существующие данные
      const existingData = await getExistingData();
      console.log("Существующие данные:", existingData);

      // Загружаем изображение
      const formData = new FormData();
      const imageFile = document.getElementById("heroImage").files[0];

      if (!imageFile) {
        throw new Error("Выберите изображение");
      }

      formData.append("image", imageFile);

      const uploadResponse = await fetch("uploadImage.php", {
        method: "POST",
        body: formData,
      });

      const uploadResult = await uploadResponse.json();
      console.log("Ответ сервера:", uploadResult);

      if (!uploadResponse.ok || !uploadResult.success) {
        throw new Error(uploadResult.error || "Ошибка загрузки изображения");
      }

      // Создаем объект с данными нового героя
      const newHero = {
        id: existingData.length + 1,
        name: document.getElementById("heroName").value,
        description: document.getElementById("heroDescription").value,
        image: `images/${uploadResult.filename}`,
        ath: parseFloat(document.getElementById("ath").value) || 0,
        atv: parseFloat(document.getElementById("atv").value) || 0,
        videos: [], // Добавьте обработку видео, если необходимо
        social: {}, // Добавьте обработку соц. сетей, если необходимо
      };

      console.log("Новый герой:", newHero);

      // Добавляем нового героя к существующим данным
      const updatedData = [...existingData, newHero];
      console.log("Обновленные данные:", updatedData);

      // Сохраняем обновленные данные
      const saveResponse = await fetch("saveHotspotData.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      const saveResult = await saveResponse.json();
      console.log("Результат сохранения:", saveResult);

      if (!saveResponse.ok || !saveResult.success) {
        throw new Error(
          `Ошибка сохранения данных: ${JSON.stringify(saveResult)}`
        );
      }

      // Проверяем, что данные действительно сохранились
      const checkResponse = await fetch("getHotspotData.php");
      const checkData = await checkResponse.json();
      console.log("Проверка сохраненных данных:", checkData);

      if (Array.isArray(checkData) && checkData.length > 0) {
        // Показываем уведомление об успехе
        const successModal = document.getElementById("successModal");
        successModal.classList.add("active");

        // Переходим на главную через 3 секунды
        setTimeout(() => {
          window.location.href = "index.html";
        }, 3000);
      } else {
        throw new Error("Данные не были сохранены корректно");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert(`Ошибка: ${error.message}`);
    }
  });
});
