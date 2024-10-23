const express = require('express');
const axios = require('axios');
const https = require('https');
const paginate = require('express-paginate');
const app = express();
const PDFDocument = require('pdfkit');
const fs = require('fs');
const puppeteer = require('puppeteer');

// Middleware pour servir les fichiers statiques
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Utiliser le middleware de pagination
app.use(paginate.middleware(25, 50)); // 25 lignes par page, 50 maximum


// Route principale
app.get('/', async (req, res) => {
  const url = 'https://dicos.intern-belgiantrain.be/api/missions';
  const headers = {
    "Accept": "application/json, text/plain, */*",
    "Authorization" : "Bearer eyJraWQiOiJiMmUtZGl0YS1zaWduaW5nLXByb2QiLCJhbGciOiJSUzI1NiJ9.eyJiX2xhbmd1YWdlIjoiZnItQkUiLCJzdWIiOiJHU0g5MDAwIiwiYl9lbXBsb3llZWlkIjoiMjY4NTkwMDA3IiwiYW1yIjpbInVybjpmZWRpY3Q6cGFzc3dvcmQiXSwiaXNzIjoiaHR0cHM6XC9cL2lkcC5pbnRlcm4tYmVsZ2lhbnJhaWwuYmVcL2lkaHViXC9vaWRjIiwiYl9sYXN0bmFtZSI6IkRlc3Nlbml1cyIsImJfZ3JvdXBzIjpbIkFQU19QX0dHX0FTU0lTVF9DT09SRElOQVRPUiJdLCJhdWQiOiIzNDA3ODI1OS1kMjA4M2IzYmI3ZGQ0ZGY0YmM3MDdjZjIzMjJkZGU4YSIsIm5iZiI6MTcyOTYzNzg0MiwiYXV0aF90aW1lIjoxNzI5NjM4MTQxLCJzY29wZSI6WyJvcGVuaWQiLCJkbXotaHIiLCJCMkUtZnVsbCJdLCJiX2ZpcnN0bmFtZSI6Ik5pY29sYXMiLCJleHAiOjE3Mjk2ODg1NDIsImJfbWFpbCI6Im5pY29sYXMuZGVzc2VuaXVzQGJlbGdpYW50cmFpbi5iZSIsImlhdCI6MTcyOTYzODE0MiwianRpIjoiMmI4N2EzYTYtOTQxZS00Yjg1LTk1YjItMGY5ZGE1YjM0MjVjIn0.UMP5Kf7mH4tXuDb7_2W2dthBzegcrF6k7paPVDku6k8hc5U5WVl4ghB_8IdvEIw8cUUZslEPYf6dbKn0mif_TY7PjohErvrG-KhDfRlkg5jgQauIa82dKGJSnjrPo9NnuHZF02rJ81B6Nhnt2JaHFcliukmZHpLbBKH62pxd32Ud5uLK4tDrRCfPlahW2MFsaQJ2NFa2j7xRCGaDosvFJDDbmY3NMRphRo1h0-lAtj6MuJDOEI53BXotcRsJzy1b58gA0L1eLuGeOl6NRlE-D0dfGFsLQWJ-tsNUsI-ZYGhQ_OGbylmkkHVEBKyWaOcxVrrBLNByOU-ABGWNdJofLgUgGitPnuLYuGidhDmvL8gsklPQRzLk7mMFlLF6uSjTPzBG8RrAiXhxqxUO2N-iBVoTYpZaHWFFMUWp_UITwobggDeweBfoiAYAgL9ElnmeHlrLIBvMhl1UhiiBLBalP3KH7Ymokmg5Cp__JdKGm7xQ0oadczMdJKXE4m3RMmH3rForMY9PIWQ9rk1kqo9eFFOFo3BXXvCGGuqYt9kFxS2BF9qDHCjQFQtmKnUsVRzClzI5o61Omy4zHWBfMQ7nJbWaWoibuOTKWJ4wLelzC9WMn3y7-98C4nrjZsGqc63gwBWaoBLb_5hhE1JpT2bG0xqBKE7M62DK1AV5lJfHm14",
    "Content-Type": "application/json",
    "Cookie" : "TS7f9f3d56027=086bfebda0ab20001b22925a5241587cdcd17605a72d31c9e338343386aa9cdd1049ab1d8c8951be08890c084a113000189b557b389eea893e449d97c9128658c783c95be2efe24656ff1c8f29abcc5b935208f089c5845a77f6c19fb213eab5"

  };

  // Date actuelle ou saisie par l'utilisateur
  let dateInput = '2024-10-23';


  const body = {
    "districtIds": ["pmr-u"],
    "date": "2024-10-23"
  };

   // Créer un agent HTTPS qui ignore les erreurs de certificats
   const agent = new https.Agent({  
    rejectUnauthorized: false // Ignorer les erreurs de certificat
  });

  try {
    // Faire la requête API
    const response = await axios.post(url, body, { headers,  httpsAgent: agent });

    // Filtrer et transformer les données
    const jsonData = response.data;
    const filteredData = jsonData
      .filter(entry => entry.reservationType === "Disabled")
      .map(entry => {
        const journey = entry.journey;
        const traveler = entry.traveler;
        const client = entry.client;

     // Récupérer et formater les heures et stations
     let journeyTime = new Date(journey.time);
     let arrivalTime = new Date(journey.otherTime);
     let stationName = journey.stationName.split('/')[0].trim();
     let otherStationName = journey.otherStationName.split('/')[0].trim();
 

 // Vérifier le type de mission
 if (entry.missionType === "Arrival") {
  // Échanger les valeurs
  const tempStation = stationName;
  stationName = otherStationName;
  otherStationName = tempStation;

  const tempJourneyTime = journeyTime; // Utiliser la variable Date
  journeyTime = arrivalTime;            // Réaffectation valide
  arrivalTime = tempJourneyTime;        // Réaffectation valide
}

// Formater les heures après les échanges
const formattedJourneyTime = journeyTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const formattedArrivalTime = arrivalTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });


        // Retourner un objet propre à afficher
        return {
          Train: (journey.trainNumber === 1000 || journey.trainNumber === 1001) ? "TAXI" : journey.trainNumber || "TAXI",
            'Heure Départ': formattedJourneyTime, // Utiliser l'objet Date directement
            'Gare Départ': stationName,
            'Assistance Départ': journey.withDepartureAssistance ? 'Y' : 'N',
            'Heure Arrivée': formattedArrivalTime,
            'Gare Arrivée': otherStationName,
            'Assistance Arrivée': journey.withArrivalAssistance ? 'Y' : 'N',
            'Client': `${client.firstName} ${client.lastName}`.toUpperCase(),
            'Nombre': traveler.disableds,
            'Type': traveler.fullAssistances ? 'Full' : traveler.lightAssistances ? 'Light' : 'None'
          };
        })
     
         .sort((a, b) => {
        // Convertir les heures formatées en Date pour le tri
        const [aHour, aMinute] = a['Heure Départ'].split(':').map(Number);
        const [bHour, bMinute] = b['Heure Départ'].split(':').map(Number);
        
        return (aHour - bHour) || (aMinute - bMinute);
      });
  

      const uniqueItems = filteredData.reduce((acc, current) => {
        // Créer une clé unique basée sur Client, Train et Heure départ
        const uniqueKey = `${current.Client}-${current.Train}-${current['Heure Départ']}-${current['Heure Arrivée']}`;
        
   // Vérifiez si la clé existe déjà
   if (!acc.find(item => item.uniqueKey === uniqueKey)) {
    acc.push({ ...current, uniqueKey }); // Ajouter un uniqueKey pour garder une trace
  }
  return acc;
}, []);

// console.log(uniqueItems);

/* const itemCount = uniqueItems.length; // Nombre total d'éléments
const pageCount = Math.ceil(itemCount / res.locals.paginate.limit); // Total de pages
const currentPage = Math.max(0, req.query.page) || 0; // Page actuelle
const paginatedItems = uniqueItems.slice(currentPage * res.locals.paginate.limit, (currentPage + 1) * res.locals.paginate.limit); // Éléments paginés */


      res.render('index', { 
        data: filteredData, dateInput,
        uniqueItems,
       
        
      
      });
    } catch (error) {
      console.error('Erreur lors de la requête API :', error);
      res.status(500).send('Erreur lors de la récupération des données');
    }
  });




  // Route pour exporter en PDF
  app.get('/export-pdf', async (req, res) => {
    try {
      // Lancer le navigateur Puppeteer
      const browser = await puppeteer.launch({
        headless: true, // exécute sans affichage d'interface graphique
      });
  
      const page = await browser.newPage();
  
      // Charger la page principale de l'application
      await page.goto('http://localhost:3000', {
        waitUntil: 'networkidle0', // Attend que toutes les ressources soient chargées
      });
  
      // Ajouter un style CSS spécifique pour l'impression (réduire la taille de la police et ajuster la mise en page)
      await page.addStyleTag({
        content: `
             @media print {
          table {
            font-size: 8px; /* Réduire la taille de la police */
            width: 100%; /* Forcer le tableau à occuper toute la largeur */
            table-layout: fixed; /* Forcer les colonnes à avoir des largeurs fixes */
          }
          th, td {
            padding: 2px;
            word-wrap: break-word;
            white-space: nowrap; /* Empêche le texte de passer à la ligne */
            overflow: hidden;
            text-overflow: ellipsis;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .page {
            width: 100%;
            margin: 0;
          }
        }
      `
        
      });
  
      // Générer le PDF de la page avec des options adaptées
      const pdfBuffer = await page.pdf({
        format: 'A4', // Format plus large pour inclure toutes les colonnes
        landscape: true,  // Export en mode paysage
        printBackground: true, // Imprimer avec les arrière-plans (pour garder le style TailwindCSS)
        margin: {
          top: '10px',
          bottom: '10px',
          left: '10px',
          right: '10px',
        },
        scale: 0.75, // Réduire la mise à l'échelle pour inclure plus de contenu sur la page
      });
  
      // Fermer le navigateur Puppeteer
      await browser.close();
  
      // Définir les en-têtes pour un fichier PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="export.pdf"');
      res.setHeader('Content-Length', pdfBuffer.length);
  
      // Envoyer le buffer PDF au client
      res.end(pdfBuffer);
  
    } catch (error) {
      console.error('Erreur lors de la génération du PDF :', error);
      res.status(500).send('Erreur lors de la génération du PDF');
    }
  });
  







// Démarrer le serveur sur le port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Le serveur tourne sur http://localhost:${PORT}`);
});
