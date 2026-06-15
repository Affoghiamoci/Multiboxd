# Multiboxd

Multiboxd è un add-on per Stremio che ti permette di integrare i cataloghi di Letterboxd direttamente nell'applicazione. Sincronizza la tua Watchlist, il tuo Diary, i film consigliati in base ai tuoi gusti e le attività dei tuoi amici, oltre a liste pubbliche personalizzate.

## Caratteristiche
- **Nessun metadato proprio**: A differenza di altri add-on, Multiboxd non fornisce metadati (descrizioni, cast, trailer, ecc.), appoggiandosi a quelli già presenti in Stremio. Questo lo rende leggerissimo e compatibile con tutti gli altri add-on, evitando fastidiosi duplicati.
- **Sincronizzazione Letterboxd**: Inserisci il tuo username e sincronizza le tue liste pubbliche. Nessuna password richiesta!
- **Supporto TMDB (Opzionale ma Consigliato)**: A causa di come Stremio gestisce i metadati visivi nei cataloghi esterni, è necessario fornire una propria API Key gratuita di TMDB se si desiderano le locandine localizzate (es. in italiano) nel grid dei cataloghi. Questa chiave abilita anche i film consigliati in base ai tuoi gusti.
- **Supporto Multilingua**: Interfaccia del sito disponibile in Italiano e Inglese.

## 📝 Note sul caricamento
Per ottimizzare i tempi di risposta ed evitare ban da parte di Letterboxd, i cataloghi vengono caricati a scaglioni di circa **100 film alla volta** mentre scorri nell'app di Stremio.
- **Liste Custom Molto Lunghe**: Se aggiungi una lista pubblica molto lunga (oltre i 100 film) e vuoi scoprire film sempre diversi presi da *tutta* la lista, ti consigliamo fortemente di attivare lo **Shuffle (🔀)** in fase di configurazione. Attivando lo shuffle, l'addon scaricherà e mescolerà l'intera lista in background prima di mostrarti i blocchi da 100.
- Il limite di caricamento a blocchi si applica a tutti i cataloghi, ma per Watchlist e Diario lo scorrimento progressivo di Stremio permette di caricare le pagine successive senza problemi.

## Come installare l'add-on
1. Visita la pagina di configurazione (es. [multiboxd.fly.dev](https://multiboxd.fly.dev) o la tua istanza locale)
2. Inserisci il tuo username Letterboxd.
3. (Opzionale) Inserisci una API Key TMDB se vuoi locandine localizzate e suggerimenti.
4. Seleziona i cataloghi che vuoi mostrare su Stremio.
5. Clicca su **Install in Stremio** o copia l'URL generato.

## 💻 Installazione in Locale / Self-Hosting

Puoi ospitare facilmente la tua istanza di Multiboxd usando **Docker** o **Node.js**.

### Opzione A: Docker (Consigliata)
Questo progetto include un `Dockerfile` multipiattaforma ottimizzato.

```bash
# 1. Clona il repository
git clone https://github.com/Affoghiamoci/Multiboxd.git
cd Multiboxd

# 2. Costruisci l'immagine Docker
docker build -t multiboxd .

# 3. Avvia il container sulla porta 3000
docker run -p 3000:3000 multiboxd
```
L'app sarà disponibile all'indirizzo `http://localhost:3000`.

### Opzione B: Node.js (Locale)
Requisiti: Node.js 18 o superiore.

```bash
# 1. Clona il repository
git clone https://github.com/Affoghiamoci/Multiboxd.git
cd Multiboxd

# 2. Installa le dipendenze
npm install

# 3. Costruisci per la produzione (opzionale ma consigliato per le prestazioni)
npm run build
npm start

# Oppure, per l'ambiente di sviluppo:
# npm run dev
```
L'app sarà disponibile all'indirizzo `http://localhost:3000`.

## 🚀 Deploy su Fly.io
L'app è già configurata per essere facilmente deployata su [Fly.io](https://fly.io) tramite il file `fly.toml` incluso.
Ti basta autenticare la CLI di Fly e lanciare:
```bash
fly deploy
```
