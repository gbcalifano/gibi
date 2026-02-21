clear all
webuse set data.califano.xyz
webuse masteristi

* ES 1

//	Descrivere il dataset

//	Descrizione RSES
//		Errore, da decodificare
//		Decodifichiamo e invertiamo
//		Somma di punteggi
//		Media etc
//		Grafichetto

//	Testare Affidabilità RSES
//		Split-Half
//		Alpha

//	Testare Validità MSE
//		Concorrente con Att
//		Predittiva con Media voti
//		Discriminante con Autostima

//	Bonus: Grafico Att

* Descrivere il dataset
describe
notes

* Descrizione RSES
	* Errore, da decodificare
	* egen rses = rowtotal(rses_*)

	* Decodifichiamo e invertiamo
	forval i=1/10 {
		replace rses_`i' = "0" if rses_`i' == "Fortemente in disaccordo"
		replace rses_`i' = "1" if rses_`i' == "In disaccordo"
		replace rses_`i' = "2" if rses_`i' == "D'accordo"
		replace rses_`i' = "3" if rses_`i' == "Fortemente d'accordo"
		destring rses_`i', replace
		replace rses_`i' = 3-rses_`i' if inlist(`i', 3, 5, 8, 9, 10)
	}

	* Somma di punteggi
	egen rses = rowtotal(rses_*)
	
	* Media etc
	summarize rses, detail
	
	* Grafichetto
	hist rses, frequency discrete xlabel(0/30)
	twoway hist rses if rses < 15, discrete color(red) || hist rses if rses >= 15, discrete color(blue)
	
* Testare Affidabilità RSES
	* Split-Half
	egen odd = rowtotal(rses_1 rses_3 rses_5 rses_7 rses_9)
	egen even = rowtotal(rses_2 rses_4 rses_6 rses_8 rses_10)
	pwcorr odd even
	twoway scatter odd even || lfit odd even
	
	* Alpha
	alpha rses_*
	alpha rses_* att_3
	alpha rses_* att_3, item

* Testare Validità MSE
	* Concorrente con Att
	egen mse = rowmean(mse_*)
	egen att = rowtotal(att_*)
	pwcorr mse att
	
	* Predittiva con Media voti
	egen media = rowmean(statistica-politica)
	regress media mse, beta
	
	* Discriminante con Autostima
	pwcorr mse rses

* Bonus: Grafico Att
collapse att_*
gen i = 1
reshape long att_, i(i) j(item)
twoway connected item att_, title("Stata è...") xtitle("") xlabel(-3/3) yaxis(1 2) ytitle("", axis(1)) ytitle("", axis(2)) ylabel(1 "Brutto" 2 "Sporco" 3 "Cattivo" 4 "Antipatico" 5 "Freddo" 6 "Triste" 7 "Puzzolente" 8 "Sgradevole" 9 "Aggressivo", axis(1)) ylabel(1 "Bello" 2 "Pulito" 3 "Buono" 4 "Simpatico" 5 "Caldo" 6 "Felice" 7 "Profumato" 8 "Piacevole" 9 "Pacifico" , axis(2)) aspect(1)
