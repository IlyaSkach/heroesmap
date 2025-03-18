document.addEventListener("DOMContentLoaded", () => {
  const prevButton = document.querySelector(".prev-button");
  const nextButton = document.querySelector(".next-button");

  // Массив с данными о героях (нужно заполнить вашими данными)
  const heroes = [
    { id: 1, name: "Иван Петров" },
    { id: 2, name: "Второй герой" },
    // ... добавьте остальных героев
  ];

  let currentHeroIndex = 0;

  function updateNavigation() {
    // Отключаем кнопку "Предыдущий" если мы на первом герое
    if (currentHeroIndex === 0) {
      prevButton.classList.add("disabled");
    } else {
      prevButton.classList.remove("disabled");
    }

    // Отключаем кнопку "Следующий" если мы на последнем герое
    if (currentHeroIndex === heroes.length - 1) {
      nextButton.classList.add("disabled");
    } else {
      nextButton.classList.remove("disabled");
    }
  }

  function showHero(index) {
    // Здесь нужно добавить логику отображения карточки героя
    // Например, обновить содержимое карточки данными из heroes[index]
    currentHeroIndex = index;
    updateNavigation();
  }

  prevButton.addEventListener("click", () => {
    if (currentHeroIndex > 0) {
      showHero(currentHeroIndex - 1);
    }
  });

  nextButton.addEventListener("click", () => {
    if (currentHeroIndex < heroes.length - 1) {
      showHero(currentHeroIndex + 1);
    }
  });

  // Инициализация навигации
  updateNavigation();
});
