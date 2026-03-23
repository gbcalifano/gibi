* make_figures.do
* Generates figures for note_1.html
* Requires: step3.ado, height.dta (via webuse), sim.dta

clear all
set seed 12345

local sj_path "/Users/giovanbattistacalifano/Library/Mobile Documents/com~apple~CloudDocs/Code/Stata Journal/REV/FINAL/software"
local out_path "/Users/giovanbattistacalifano/Documents/Lavoro/Varie/gibi/notes/img"

* Load step3
quietly do `"`sj_path'/step3.ado"'


* =============================================
* FIGURE 2: Bias comparison (height example)
* =============================================

webuse set "https://califano.xyz/data"
webuse height

quietly fmm 2, nolog: regress height
quietly predict cpost*, classposteriorpr

generate Class = 1
replace Class = 2 if cpost2 > cpost1

* True difference (using observed sex variable)
quietly tabstat y, by(sex) statistics(mean) nototal save
scalar ytrue1 = r(Stat1)[1,1]
scalar ytrue2 = r(Stat2)[1,1]
scalar ytrue_diff = scalar(ytrue2) - scalar(ytrue1)

* Naive modal
quietly tabstat y, by(Class) statistics(mean) nototal save
scalar ynaive1 = r(Stat1)[1,1]
scalar ynaive2 = r(Stat2)[1,1]
scalar ynaive_diff = scalar(ynaive2) - scalar(ynaive1)

* BCH
quietly step3 y, pr(cpost) lclass(W) outcome bch
scalar ybch_diff = _b[2.W] - _b[1.W]

* ML
quietly step3 y, pr(cpost) lclass(W) outcome
scalar yml_diff = _b[2.W] - _b[1.W]

* Plot
preserve
clear
set obs 4
generate double diff = .
generate str20 label = ""
generate byte order = .

replace diff  = scalar(ytrue_diff)  in 1
replace diff  = scalar(ynaive_diff) in 2
replace diff  = scalar(ybch_diff)   in 3
replace diff  = scalar(yml_diff)    in 4

replace label = "True difference"  in 1
replace label = "Naive (modal)"    in 2
replace label = "BCH corrected"    in 3
replace label = "ML corrected"     in 4
replace order = _n

graph hbar (asis) diff, over(label, sort(order)) ///
    ytitle("Estimated group difference in y") ///
    ylabel(-0.6(0.1)0) ///
    bar(1, fcolor("153 153 153") lcolor(none)) ///
    bar(2, fcolor("213 94 0")    lcolor(none)) ///
    bar(3, fcolor("0 114 178")   lcolor(none)) ///
    bar(4, fcolor("0 158 115")   lcolor(none)) ///
    scheme(s1color) legend(off)

graph export `"`out_path'/note1_fig2.png"', width(700) replace
restore


* =============================================
* FIGURE 4: Simulation evidence
* =============================================

use `"`sj_path'/sim.dta"', clear

* Compute means for each method x class
foreach i in 1 2 3 4 {
    foreach k in 1 2 3 {
        quietly summarize b`i'`k'
        local m`i'`k' = r(mean)
    }
}

* Build plotting dataset (one row per class)
clear
set obs 3
generate class = _n

generate double true = cond(_n==1, -2,        cond(_n==2, 0,        2       ))
generate double hard = cond(_n==1, `m11',      cond(_n==2, `m12',    `m13'   ))
generate double soft = cond(_n==1, `m21',      cond(_n==2, `m22',    `m23'   ))
generate double ml   = cond(_n==1, `m31',      cond(_n==2, `m32',    `m33'   ))
generate double bch  = cond(_n==1, `m41',      cond(_n==2, `m42',    `m43'   ))

label define class_l 1 "Class 1 ({&theta}=−2)" 2 "Class 2 ({&theta}=0)" 3 "Class 3 ({&theta}=+2)"
label values class class_l

graph bar (asis) true hard soft ml bch, over(class) ///
    bar(1, fcolor("153 153 153") lcolor(none)) ///
    bar(2, fcolor("213 94 0")    lcolor(none)) ///
    bar(3, fcolor("230 159 0")   lcolor(none)) ///
    bar(4, fcolor("0 158 115")   lcolor(none)) ///
    bar(5, fcolor("0 114 178")   lcolor(none)) ///
    legend(label(1 "True") label(2 "Hard") label(3 "Soft") label(4 "ML") label(5 "BCH") ///
           rows(1) position(6)) ///
    ytitle("Estimated mean of Z") ///
    ylabel(-2(1)2) ///
    scheme(s1color)

graph export `"`out_path'/note1_fig4.png"', width(900) replace
