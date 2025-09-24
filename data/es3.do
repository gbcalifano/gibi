clear all
webuse set data.califano.xyz
webuse mamme

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
