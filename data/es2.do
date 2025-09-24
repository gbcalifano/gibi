clear all
webuse set data.califano.xyz
webuse masteristi

d

* ES 2

* Analisi fattoriale confermativa (CFA) per gli atteggiamenti verso Stata
sem (ATT -> att_*), standardized // Aggiungiamo l'opzione "standardized" per ottenere loadings standardizzati

// Il test del chi2 per la bontà del modello è sensibile alla numerosità campionaria. Facciamo una prova...
preserve
expand 3 // Moltiplichiamo le osservazioni x3
sem (ATT -> att_*), standardized //Ora il chi2 è significativo
restore

// Meglio usare più indici per valutare la bontà di una CFA
sem (ATT -> att_*), standardized
estat gof, stats(all)

// Passiamo a dei dati reali
webuse mamme, clear
sem (ATT -> att_*), standardized
estat gof, stats(all)
