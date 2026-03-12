const API_KEY = 'ghuES0fZBKhuiOSrRcdGUxz3oVZKseotAHxaCd4v'; 
const input = document.getElementById('foodInput');
const btn = document.getElementById('searchBtn');
const resultsArea = document.getElementById('results');

let targets = { cals: 0, pro: 0, fat: 0, carb: 0 };
let consumed = { cals: 0, pro: 0, fat: 0, carb: 0 };
let currentFoodPerGram = { cals: 0, pro: 0, fat: 0, carb: 0 };

document.getElementById('setTargetsBtn').addEventListener('click', () => {
    targets.cals = parseFloat(document.getElementById('targetCals').value) || 0;
    targets.pro = parseFloat(document.getElementById('targetPro').value) || 0;
    targets.fat = parseFloat(document.getElementById('targetFat').value) || 0;
    targets.carb = parseFloat(document.getElementById('targetCarb').value) || 0;
    
    document.getElementById('remainingArea').style.display = 'block';
    updateRemainingUI();
});

function updateRemainingUI() {
    document.getElementById('remCals').innerText = Math.round(targets.cals - consumed.cals);
    document.getElementById('remPro').innerText = Math.round(targets.pro - consumed.pro) + ' g';
    document.getElementById('remFat').innerText = Math.round(targets.fat - consumed.fat) + ' g';
    document.getElementById('remCarb').innerText = Math.round(targets.carb - consumed.carb) + ' g';
}

async function getNutrition() {
    const query = input.value.trim();
    if (!query) return;

    resultsArea.innerHTML = 'LOADING...';

    const resp = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${API_KEY}&query=${encodeURIComponent(query)}&pageSize=1`);
    const data = await resp.json();

    if (data.foods && data.foods[0]) {
        const food = data.foods[0];
        
        const getRawNut = (name) => {
            const n = food.foodNutrients.find(item => item.nutrientName.toLowerCase().includes(name.toLowerCase()));
            return n ? n.value : 0;
        };

        const findNut = (name) => {
            const n = food.foodNutrients.find(item => item.nutrientName.toLowerCase().includes(name.toLowerCase()));
            return n ? `${Math.round(n.value)} ${n.unitName.toLowerCase()}` : '0';
        };

        let baseServing = food.servingSize || 100; 
        currentFoodPerGram.cals = getRawNut('Energy') / baseServing;
        currentFoodPerGram.pro = getRawNut('Protein') / baseServing;
        currentFoodPerGram.fat = getRawNut('Total lipid') / baseServing;
        currentFoodPerGram.carb = getRawNut('Carbohydrate') / baseServing;

        let portion = food.servingSize ? `${food.servingSize}${food.servingSizeUnit}` : "100G";

        resultsArea.innerHTML = `
            <div class="card">
                <strong style="display:block; margin-bottom:5px;">${food.description.toUpperCase()}</strong>
                <p style="font-size: 11px; margin-bottom: 15px; border-bottom: 1px solid black; padding-bottom: 5px;">
                    PER ${portion.toUpperCase()}
                </p>
                <div class="label-row"><span>CALORIES</span><span>${findNut('Energy')}</span></div>
                <div class="label-row"><span>PROTEIN</span><span>${findNut('Protein')}</span></div>
                <div class="label-row"><span>FAT</span><span>${findNut('Total lipid')}</span></div>
                <div class="label-row"><span>CARBS</span><span>${findNut('Carbohydrate')}</span></div>
                
                <div class="search-group" style="margin-top: 15px; margin-bottom: 0;">
                    <input type="number" id="consumeGrams" placeholder="Grams eaten" min="1" autocomplete="off">
                    <button onclick="addToTotals()">Add</button>
                </div>
            </div>`;
    } else {
        resultsArea.innerHTML = '<div class="error-msg">NOT FOUND</div>';
    }
}

window.addToTotals = function() {
    const grams = parseFloat(document.getElementById('consumeGrams').value);
    if (!grams || grams <= 0) return;

    consumed.cals += currentFoodPerGram.cals * grams;
    consumed.pro += currentFoodPerGram.pro * grams;
    consumed.fat += currentFoodPerGram.fat * grams;
    consumed.carb += currentFoodPerGram.carb * grams;

    updateRemainingUI();
    resultsArea.innerHTML = `<div class="card"><strong style="display:block;">ADDED ${grams}g TO DAILY TOTAL!</strong></div>`;
    input.value = ''; 
};

const today = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const formattedDate = today.toLocaleDateString('en-US', options);
    document.getElementById('todayDate').textContent = formattedDate;

btn.addEventListener('click', getNutrition);
input.addEventListener('keypress', (e) => { if (e.key === 'Enter') getNutrition(); });