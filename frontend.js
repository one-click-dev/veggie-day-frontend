'use strict';

let selectedIngredients = [];
let ingredients = [];
const ApiBasePath = 'https://recipe.one-click.dev/api';


// FUNKTIONS

const init = () => {
    fetch(ApiBasePath + '/ingredients').then(
        answer => answer.json()
    ).then(function (answer) {

        for (let i = 0; i < answer.total_rows; i++) {

            let ingredientNode = initButton(answer.rows[i].doc);
            ingredientNode.addEventListener("click", toggleIngredient);
            let divIngredients = document.querySelector("#ingredients");
            let divCategory = document.querySelector(`div[data-category-name="${answer.rows[i].doc.category}"]`);

            // Create categories

            if (divCategory == null) {
                divCategory = document.createElement("div");
                divCategory.className = "mb-1 pb-2 border-bottom";
                divCategory.dataset.categoryName = answer.rows[i].doc.category;
                let categoryHeader = document.createElement("h5");
                categoryHeader.className = "mt-2 mb-0 ml-1";
                categoryHeader.textContent = answer.rows[i].doc.category;

                divCategory.appendChild(categoryHeader);
                divCategory.appendChild(ingredientNode);
                divIngredients.appendChild(divCategory);

            } else {
                divCategory.appendChild(ingredientNode);
            }
        }
        ingredients = answer.rows;
        findRecipes([], showRecipes);
        showViewedRecipes();
    })
}


// INIT

init();


// Create the buttons for the ingredients

function initButton(ingredient) {
    let span = document.createElement("span");
    span.className = "badge badge-secondary ingredients-button";
    span.dataset.id = ingredient._id;
    span.textContent = ingredient.localName;
    return span;
}


// Toggle

function toggleIngredient() {
    if (!this.classList.contains("selected-ingredient")) {
        this.classList.add("selected-ingredient");
        selectedIngredients.push(this.dataset.id);
    } else {
        this.classList.remove("selected-ingredient");
        let removedId = this.dataset.id;
        selectedIngredients = selectedIngredients.filter(function (id) {
            if (id == removedId) {
                return false;
            } else {
                return true;
            }
        })
    }
    console.log(selectedIngredients);

    findRecipes(selectedIngredients, showRecipes);
}


// Filter the recipes by the selected ingredient

function findRecipes(ingredients = [], successCallback) {
    let responsePromise;
    if (ingredients.length > 0) {
        responsePromise = fetch(ApiBasePath + '/recipes/findWithIngredients/' + ingredients.join(','));
    } else {
        responsePromise = fetch(ApiBasePath + '/recipes');
    }
    responsePromise.then(
        answer => answer.json()
    ).then(function (answer) {
        successCallback(answer);
    }).catch(
        console.log
    )
}


// Show found recipes as short info (cards)

function showRecipes(recipes) {
    document.querySelector("div#recipes").innerHTML = "";
    recipes.rows.forEach(function (elem) {
        let name = elem.value.name;
        let photo = elem.value.photo;
        let teaser = elem.value.teaser;

        let listStart = document.createElement("div");
        listStart.className = "card col-sm-3 mb-1 ml-1";

        let listPhoto = document.createElement("img");
        listPhoto.className = "card-img img-list";
        listPhoto.src = photo;

        let listBody = document.createElement("div");
        listBody.className = "card-body";

        let listName = document.createElement("h5");
        listName.className = "card-title";
        listName.textContent = name;

        let listTeaser = document.createElement("p");
        listName.className = "card-text";
        listTeaser.textContent = teaser;

        let buttonCard = document.createElement("a");
        buttonCard.className = "btn btn-dark text-white card-button";
        buttonCard.dataset.id = elem.id;

        buttonCard.textContent = "Zum Rezept";

        listStart.appendChild(listPhoto);
        listBody.appendChild(listName);
        listBody.appendChild(listTeaser);
        listBody.appendChild(buttonCard);
        listStart.appendChild(listBody);

        document.querySelector("div.recipes-box").appendChild(listStart);

        // Modal
        // LocalStorage
        buttonCard.addEventListener("click", function () {
            showRecipeInModal(this.dataset.id);
    
            // Check if something is present in the LocalStorage
            let viewedRecipes = JSON.parse(localStorage.getItem("viewedRecipes"));
    
            if (viewedRecipes === null) {
                localStorage.setItem("viewedRecipes", JSON.stringify(viewedRecipes));
                viewedRecipes = [];
            }
    
            // If a recipe with a certain id is not available, then add
            if (viewedRecipes.indexOf(this.dataset.id) === -1) {
                viewedRecipes.push(this.dataset.id);
            }
            localStorage.setItem("viewedRecipes", JSON.stringify(viewedRecipes));
            showViewedRecipes();
        });
    })
}


function showRecipeInModal(recipeId) {

    fetch(ApiBasePath + '/recipes/' + recipeId).then(
        answer => answer.json()
    ).then(function (selectedRecipe) {

        let modal = document.querySelector("#modalCenter");

        let modalPic = modal.querySelector("div.block-pic");
        let modalPhoto = document.createElement("img");
        modalPhoto.src = selectedRecipe.photo;
        modalPhoto.className = "modal-img";

        modalPic.innerHTML = "";
        modalPic.prepend(modalPhoto);

        modal.querySelector("h5#modalCenterTitle").innerHTML = selectedRecipe.name;
        modal.querySelector("div.block-recipe").innerHTML = selectedRecipe.method.replace(/\n/g, "<br />");

        // Ingredients in Modal
        let modalIngredients = document.createElement("ul");
        let blockNameIngredients = modal.querySelector("div.block-name-ingredients");
        modalIngredients.className = "modal-ingredients";

        blockNameIngredients.innerHTML = "";

        selectedRecipe.ingredients.forEach(function (elem) {
            let name;
            let found;
            // All Ingredients in Modal
            for (let i = 0; i < ingredients.length; i++) {
                if (ingredients[i].doc._id === elem.name) {
                    name = ingredients[i].doc.localName;
                    break;
                }
            }
            // Ingredients that User has
            for (let i = 0; i < selectedIngredients.length; i++) {
                if (selectedIngredients[i] === elem.name) {
                    found = true;
                }
            }

            let amount = elem.amount;
            let unit = elem.unit;

            let ingredientString = document.createElement("li");

            if (found) {
                ingredientString.className = "found-ingredient";
            }
            ingredientString.innerHTML = (`${amount} ${unit} ${name}`);
            modalIngredients.appendChild(ingredientString);

        })
        blockNameIngredients.appendChild(modalIngredients);

        $("#modalCenter").modal();
    })
}

// Viewed recipes

function showViewedRecipes() {
    let viewedRecipes = JSON.parse(localStorage.getItem("viewedRecipes"));

    if(viewedRecipes === null) {
        return;
    }

    let headerViewedRecipes = document.createElement("h5");
    headerViewedRecipes.innerHTML = "Du hast schon angeschaut:";
    let listStart = document.createElement("ul");
    listStart.className = "pl-3";

    document.querySelector("div#viewed-recipes").innerHTML = "";

    fetch(ApiBasePath + '/recipes/findByNames/' + viewedRecipes.join(',')).then(
        answer => answer.json()
    ).then(function (answer) {

        for (let i = 0; i < answer.rows.length; i++) {
            let listName = document.createElement("li");
            listName.className = "linkViewedRecipe";
            listName.textContent = answer.rows[i].value.name;
            listName.dataset.id = answer.rows[i].id;

            listName.addEventListener("click", function () {
                // By clicking on li the recipe is displayed in modal
                showRecipeInModal(this.dataset.id);
            });
            listStart.appendChild(listName);
        }
    })

    document.querySelector("div#viewed-recipes").appendChild(headerViewedRecipes);
    document.querySelector("div#viewed-recipes").appendChild(listStart);


    // Check if something is present in the LocalStorage

    viewedRecipes = JSON.parse(localStorage.getItem("viewedRecipes"));
    console.log(viewedRecipes);

    if (viewedRecipes === null) {
        viewedRecipes = [];
    }
}




