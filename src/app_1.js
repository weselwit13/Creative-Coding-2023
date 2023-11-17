// API endpoint and key for Cohere.ai
const cohereUrl = 'https://api.cohere.ai/v1/generate';
const COHERE_KEY = 'kJwxouHb0UCaLkZxcXXc8ZrUUmho1P8OCM6WmW4t';
// API endpoint and key for ElevenLabs
const elevenLabsApiKey = 'b01e100c3acb6f7da1ca0485296de6b2';
const elevenLabsTtsEndpoint = 'https://api.eleven-labs.com/v1/tts';
let chatHistory = [];
let temp = "";

let anim = true;

let generatedText = document.getElementById("generatedText")

//bottoni genere storia
let genere;
let bottoniArray = document.getElementsByClassName("button gen");
Array.from(bottoniArray).forEach(tipo => {
  tipo.addEventListener("click", function () {
    // Toggle the "clicked" class on the clicked button
    tipo.classList.toggle("clicked");

    // Update the genere variable with the button's innerHTML
    genere = tipo.innerHTML;
    console.log(genere);

    // Log the classList for debugging
    console.log(tipo.classList);
  });
});

//selezione anno
let yearSlider = document.getElementById("year");
let selectedYear = 1000;

// Add an event listener for the "input" event
yearSlider.addEventListener("input", function () {
  // Update the variable with the current value of the year slider
  selectedYear = yearSlider.value;

  // Do something with the updated value, for example, log it to the console
  console.log("Selected year:", selectedYear);
});

//tasto chiusura storia
let detail = document.querySelector("#detail")
let close = document.querySelector("#close");
close.addEventListener("click", () => {
  detail.classList.remove("active")
})

const loadingDots = document.getElementById('loadingDots');

let intervalId; 
const dots = document.querySelectorAll('.dot');

// Funzione per animare i puntini
function animateDots() {
  if (anim) {
    function toggleDots() {
      dots.forEach(dot => dot.classList.toggle('active'));
    }
  
    intervalId = setInterval(toggleDots, 1500);

  } else {
    clearInterval(intervalId);

    dots.forEach(dot => dot.classList.remove('active'));
  }
}

// Funzione per ottenere la posizione attuale
async function getCurrentLocation() {
  animateDots()
  detail.classList.add("active")

  if ("geolocation" in navigator) {

    navigator.geolocation.getCurrentPosition(async function (position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      // Utilizza Nominatim per ottenere l'indirizzo approssimativo
      var nominatimApiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
      try {
        // Converti le coordinate GPS in un indirizzo
        const response = await fetch(nominatimApiUrl);
        const data = await response.json();

        // Estrai l'indirizzo approssimativo dalla risposta
        const street = data.address.road || data.address.suburb;
        const city = data.address.city || data.address.town || data.address.village;
        const province = data.address.county;
        const address = street + ", " + city + ", " + province;
        // Aggiorna l'indirizzo nel documento HTML
        //document.getElementById("address").textContent = address;
        // console.log(address);

        // Crea il prompt per Cohere-ai
        const prompt = `You are a writer of ${genere} stories, narrate me the beginning of a story at ${address} around the ${selectedYear}'s. Start directly with the narration. You are NOT a bot. DO NOT ask questions. DO NOT mention ${address}. DO NOT answer with “sure” and similars.`;

        // Esegui la generazione del testo con Cohere-ai
        console.log(prompt);
        console.log("\n\n------------------------------------------------------------\n\n");
        const generatedText = await cohereGeneratePrompt(prompt + ".max 50 words.");
        console.log(generatedText);


        // Aggiorna il testo generato nel documento HTML
        document.getElementById("generatedText").textContent = generatedText;
        // Leggi il testo generato ad alta voce con ElevenLabs TTS
        speak(generatedText);

      } catch (error) {
        console.error("Errore nella richiesta di geocodifica:", error);
      }
    });
  } else {
    alert("Il GPS non è supportato su questo dispositivo.");
  }
}

// Funzione per generare il testo con Cohere-ai
async function cohereGeneratePrompt(sentence) {
  // Construct the data object to send to Cohere API.
  const data = JSON.stringify({
    "model": "command-nightly",
    "prompt": sentence,
    "max_tokens": 130,
    "temperature": 0.9,
    "k": 0,
    "stop_sequences": [],
    "return_likelihoods": "NONE"
  });

  //Velocità con cui appare il testo
  function animateGeneratedText(text, element, index = 0) {


    // Clear the existing content before appending
    element.innerHTML = '';

    function appendNextChar() {
      if (index < text.length) {
        element.innerHTML += text.charAt(index);
        index++;
        anim = false;
        setTimeout(appendNextChar, 0);
      }
    }

    // Start the animation
    appendNextChar();
  }



  // Configuration details for the Axios request.
  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: cohereUrl, // Use the constant defined above.
    headers: {
      'Authorization': 'BEARER ' + COHERE_KEY,
      'Content-Type': 'application/json'
    },
    data: data
  };
  try {
    const response = await axios.request(config);

    if (response.status !== 200) {
      throw new Error(`Cohere.ai API request failed with status ${response.status}`);
    }

    const answer = response.data.generations[0].text;
    console.log(answer);

    temp = answer;

    animateGeneratedText(answer, generatedText);

    generatedText.innerHTML = answer;
    return answer;
  } catch (error) {
    console.error("Error in Cohere.ai API request:", error.message);
    return "Errore nella generazione del testo";
  }
}

//IA Lettura testo
async function speak(generatedText) {
  const text = generatedText;
  const voiceId = "21m00Tcm4TlvDq8ikWAM";

  const headers = new Headers();
  headers.append("Accept", "audio/mpeg");
  headers.append("xi-api-key", "7e3f3d6ca1b824bceb1a727f107eaac7");
  headers.append("Content-Type", "application/json");

  const body = JSON.stringify({
    text: text,
    model_id: "eleven_monolingual_v1",
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.5,
    },
  });

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: "POST",
      headers: headers,
      body: body,
    });

    if (!response.ok) {
      console.error(`Error: ${response.status} - ${response.statusText}`);
      const responseText = await response.text();
      console.error("Response Text:", responseText);
      throw new Error("Text to Speech API request failed");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => {
      // Handle completion if needed
    };
  } catch (error) {
    console.error("Error in ElevenLabs TTS API request:", error.message);
  }
}

// Funzione per CONTINUARE LA STIORIA
async function nextChapter() {

  detail.classList.add("active")


  if ("geolocation" in navigator) {

    navigator.geolocation.getCurrentPosition(async function (position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      // Utilizza Nominatim per ottenere l'indirizzo approssimativo
      var nominatimApiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
      try {
        // Converti le coordinate GPS in un indirizzo
        const response = await fetch(nominatimApiUrl);
        const data = await response.json();

        // Estrai l'indirizzo approssimativo dalla risposta
        const street = data.address.road || data.address.suburb;
        const city = data.address.city || data.address.town || data.address.village;
        const province = data.address.county;
        const address = street + ", " + city + ", " + province;
        // Aggiorna l'indirizzo nel documento HTML
        //document.getElementById("address").textContent = address;
        console.log(address);

        // Crea il prompt per Cohere-ai

        let prompt;

        if (temp != "") {
          prompt = `You are a writer of ${genere} stories. Continue this story in this ${genere} set in ${selectedYear}'s in ${city} where the beginning of the text is this: ${temp}. Start directly with the narration. You are NOT a bot. DO NOT ask questions at the end. DO NOT mention ${address}. DO NOT answer with “sure” and similars.`;

        } else {
          prompt = `You are a writer of ${genere} stories. Continue this story in this ${genere} set in ${selectedYear}'s in ${city} where the beginning of the text is this: ${temp}. Start directly with the narration. You are NOT a bot. DO NOT ask questions at the end. DO NOT mention ${address}. DO NOT answer with “sure” and similars.`;

        }

        // Esegui la generazione del testo con Cohere-ai
        console.log(prompt);
        console.log("\n\n------------------------------------------------------------\n\n");
        const generatedText = await cohereGeneratePrompt(prompt + ".max 50 words.");
        temp = generatedText;
        console.log(generatedText);

        // Aggiorna il testo generato nel documento HTML
        document.getElementById("generatedText").textContent = generatedText;
        // Leggi il testo generato ad alta voce con ElevenLabs TTS
        speak(generatedText);

      } catch (error) {
        console.error("Errore nella richiesta di geocodifica:", error);
      }
    });
  } else {
    alert("Il GPS non è supportato su questo dispositivo.");
  }
}

//CONCLUDI STORIA
async function finishStory() {

  detail.classList.add("active")

  if ("geolocation" in navigator) {

    navigator.geolocation.getCurrentPosition(async function (position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      // Utilizza Nominatim per ottenere l'indirizzo approssimativo
      var nominatimApiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
      try {
        // Converti le coordinate GPS in un indirizzo
        const response = await fetch(nominatimApiUrl);
        const data = await response.json();

        // Estrai l'indirizzo approssimativo dalla risposta
        const street = data.address.road || data.address.suburb;
        const city = data.address.city || data.address.town || data.address.village;
        const province = data.address.county;
        const address = street + ", " + city + ", " + province;
        // Aggiorna l'indirizzo nel documento HTML
        //document.getElementById("address").textContent = address;
        console.log(address);

        // Crea il prompt per Cohere-ai

        let prompt;

        if (temp != "") {
          prompt = `You are a writer of ${genere} stories. Write the conclusion of this story in this ${genere} set in ${selectedYear}'s in ${city} where the beginning of the text is this: ${temp}. Start directly with the narration. You are NOT a bot. DO NOT ask questions at the end. DO NOT mention ${address}. DO NOT answer with “sure” and similars.`;

        } else {
          prompt = `You are a writer of ${genere} stories. Write the conclusion of this story in this ${genere} set in ${selectedYear}'s in ${city} where the beginning of the text is this: ${temp}. Start directly with the narration. You are NOT a bot. DO NOT ask questions at the end. DO NOT mention ${address}. DO NOT answer with “sure” and similars.`;

        }

        // Esegui la generazione del testo con Cohere-ai
        console.log(prompt);
        console.log("\n\n------------------------------------------------------------\n\n");
        const generatedText = await cohereGeneratePrompt(prompt + ".max 50 words.");
        temp = generatedText;
        console.log(generatedText);

        // Aggiorna il testo generato nel documento HTML
        document.getElementById("generatedText").textContent = generatedText;
        // Leggi il testo generato ad alta voce con ElevenLabs TTS
        speak(generatedText);

      } catch (error) {
        console.error("Errore nella richiesta di geocodifica:", error);
      }
    });
  } else {
    alert("Il GPS non è supportato su questo dispositivo.");
  }
}
