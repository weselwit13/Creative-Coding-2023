const slider = document.getElementById('year');
const currentValue = document.getElementById('current-value');

const slider2 = document.getElementById('chapter');
const currentValue2 = document.getElementById('current-valueb');

slider.addEventListener('input', function() {
    const min = parseInt(this.min);
    const max = parseInt(this.max);
    const percent = ((this.value - min) / (max - min)) * 100;

    const thumbWidth = parseFloat(getComputedStyle(this).getPropertyValue('--thumb-width')) || 15;
    const thumbPosition = (percent / 100) * (this.offsetWidth - thumbWidth);

    currentValue.textContent = this.value;
    currentValue.style.left = `calc(${thumbPosition}px - ${thumbWidth / 2}px)`;

});

// slider2.addEventListener('input', function() {
//     const min = parseInt(this.min);
//     const max = parseInt(this.max);
//     const percent = ((this.value - min) / (max - min)) * 100;

//     const thumbWidth = parseFloat(getComputedStyle(this).getPropertyValue('--thumb-width')) || 15;
//     const thumbPosition = (percent / 100) * (this.offsetWidth - thumbWidth);

//     currentValue2.textContent = this.value;
//     currentValue2.style.left = `calc(${thumbPosition}px - ${thumbWidth / 2}px )`;

// });
