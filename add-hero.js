let globalKrpano = null;
let isSelectingLocation = true;
let selectedCoordinates = null;

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
  const selectPointModal = document.getElementById("selectPointModal");
  const heroFormModal = document.getElementById("heroFormModal");
  const cancelSelection = document.getElementById("cancelSelection");
  const cancelForm = document.getElementById("cancelForm");
  const heroForm = document.getElementById("heroForm");

  // Обработчик клика на кнопку "Добавить героя"
  addHeroButton.addEventListener("click", () => {
    isSelectingLocation = true;
    selectPointModal.classList.add("active");
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

      // Закрываем первое модальное окно
      selectPointModal.classList.remove("active");

      // Заполняем координаты в форме
      document.getElementById("athValue").textContent = selectedCoordinates.ath;
      document.getElementById("atvValue").textContent = selectedCoordinates.atv;

      // Показываем второе модальное окно с формой
      heroFormModal.classList.add("active");

      // Отключаем режим выбора точки
      isSelectingLocation = false;
    }
  }

  // Добавляем обработчик клика на панораму
  document.getElementById("pano").addEventListener("click", handlePanoClick);

  // Обработчики кнопок "Отмена"
  cancelSelection.addEventListener("click", () => {
    isSelectingLocation = false;
    selectPointModal.classList.remove("active");
  });

  cancelForm.addEventListener("click", () => {
    heroFormModal.classList.remove("active");
  });

  // Обработчик отправки формы
  heroForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      // Проверяем, что координаты выбраны
      if (!selectedCoordinates) {
        throw new Error("Координаты не выбраны");
      }

      // Создаем нового героя с проверкой всех полей
      const heroData = {
        id: Date.now(),
        name: document.getElementById("heroName").value.trim(),
        profession: document.getElementById("heroProfession").value.trim(),
        region: document.getElementById("heroRegion").value.trim(),
        description: document.getElementById("heroDescription").value.trim(),
        ath: Number(selectedCoordinates.ath),
        atv: Number(selectedCoordinates.atv),
        image: "",
        videos: [],
        rating: 0, // Добавляем нулевой рейтинг для совместимости
      };

      // Проверяем обязательные поля
      if (
        !heroData.name ||
        !heroData.profession ||
        !heroData.region ||
        !heroData.description
      ) {
        throw new Error("Пожалуйста, заполните все поля");
      }

      // Получаем существующие данные из localStorage
      let existingData = [];
      const savedData = localStorage.getItem("hotspotData");
      if (savedData) {
        existingData = JSON.parse(savedData);
      }

      // Добавляем нового героя
      existingData.push(heroData);

      // Сохраняем обновленные данные в localStorage
      localStorage.setItem("hotspotData", JSON.stringify(existingData));

      console.log("Герой успешно добавлен:", heroData);

      // Показываем красивое уведомление об успехе
      const successModal = document.getElementById("successModal");
      successModal.classList.add("active");

      // Через 3 секунды переходим на главную
      setTimeout(() => {
        window.location.href = "index.html";
      }, 3000);
    } catch (error) {
      console.error("Ошибка при сохранении данных:", error);
      alert(`Ошибка: ${error.message}`);
    }
  });
});
