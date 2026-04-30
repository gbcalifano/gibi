clear all
webuse set "https://califano.xyz/data"
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

// Modello di misurazione per una TPB
sem (INT -> int_*) (ATT -> att_*) (SN -> sn_*) (PBC -> pbc_*), standardized 

// Valutiamo unidimensionalità e validità discriminante con CONDISC
* findit condisc
condisc

// Includiamo il modello strutturale
sem (INT -> int_*) (ATT -> att_*) (SN -> sn_*) (PBC -> pbc_*) (ATT SN PBC -> INT), standardized
estat gof, stats(all)

// Valutiamo R2
estat eqgof

// Il modello è migliorabile?
estat mindices

sem (INT -> int_*) (ATT -> att_*) (SN -> sn_*) (PBC -> pbc_*) (ATT SN PBC -> INT), standardized cov(e.pbc_3*e.pbc_4)
