# Un decembrie cu noi · Pentru Ana

Site pentru mobil, cu 31 de fotografii si descrieri personale. JavaScript simplu, Phaser 3.90 si Rex UI 1.80.17, incluse local. Nu necesita instalarea unor pachete si nu foloseste framework sau compilare.

## Pornire locala

Din acest folder:

```sh
npm start
```

Deschide http://localhost:4173. Pentru telefon, conecteaza-l la aceeasi retea si foloseste adresa locala a calculatorului cu portul 4173. Site-ul trebuie servit prin HTTP; modulele JavaScript nu se incarca prin deschiderea directa a fisierului HTML.

## Previzualizare locala: toate zilele deschise

Porneste site-ul cu `npm start`, apoi deschide:

http://localhost:4173/

Previzualizarea se activeaza automat numai pe `localhost`, `127.0.0.1` sau `[::1]`. Permite deschiderea tuturor celor 31 de zile, pastrand intrebarile si animatiile. Progresul acestei previzualizari este separat de progresul normal. Adauga `?preview=0` pentru a testa blocarea dupa data. Pe GitHub Pages, parametrul nu deblocheaza nicio zi.

## Calendar

- Decembrie **2026**, ora Romaniei (`Europe/Bucharest`).
- Ziua curenta si zilele trecute se pot deschide. Zilele viitoare raman inchise. Dupa decembrie, amintirile raman accesibile.
- Ordinea celor 31 de fotografii a fost amestecata o singura data si salvata in `memories.js`. Nu exista amestecare la incarcare.
- Fiecare poza se vede integral, cu `object-fit: contain` si fundal negru. Descrierile sunt inserate ca text, nu HTML.
- Deschiderea roteste usa lent la 180° si o mareste inainte de afisarea amintirii. Preferinta sistemului pentru miscare redusa este respectata.
- Calendarul retine pe dispozitiv amintirile deschise. Reincarcarea nu schimba ordinea si nu deblocheaza zile viitoare.
- Zilele 2, 6, 15 si 17 cer un raspuns corect inainte de afisarea pozei si a descrierii. Intrebarile sunt, in ordine: semnul de la Dumnezeu, benzinaria, tortul preferat, masajul. Verificarea ignora literele mari si diacriticele, accepta cuvantul cerut in interiorul raspunsului si permite incercari nelimitate. Dupa rezolvare, amintirea poate fi revazuta in aceeasi sesiune fara repetarea intrebarii.
- Calendarul este randat la densitatea ecranului (pana la 3x), cu text si ilustratii la rezolutie marita. Pe mobil ocupa latimea ecranului; pe desktop ramane centrat, cu fundal de iarna pe laterale.
- Butonul de ninsoare opreste sau porneste fulgii bleu.
- Calendarul are butoane pentru tastatura si cititoare de ecran. Popupul se inchide si cu Escape.

Fotografiile excluse si `selection.json` raman doar local, prin `.gitignore`. In repository intra doar fotografiile selectate. Pentru modificarea continutului publicat, editeaza `memories.js`.

## GitHub Pages

Toate adresele resurselor sunt relative, astfel ca site-ul functioneaza si intr-un subfolder de repository. Nu exista `CNAME`.

Mai intai salveaza si trimite fisierele in ramura `main` a repository-ului tau, apoi:

```sh
./deploy.sh
```

Scriptul:

1. Sterge ramura locala `gh-pages`, daca exista si nu este folosita de un director de lucru.
2. Preia `main` de pe `origin` si il exporta intr-un folder temporar, fara a schimba fisierele sau ramura in care lucrezi.
3. Pregateste o ramura `gh-pages` noua, cu fisierele site-ului si doar fotografiile folosite.
4. Publica ramura, verificand ca altcineva nu a actualizat-o intre timp.
5. Sterge folderul temporar.

Ai nevoie de Git, Node.js si acces de scriere la repository. Nu include modificarile locale nesalvate in `main`. La prima publicare, in GitHub alege **Settings → Pages → Deploy from a branch → gh-pages → / (root)**.

## Verificari

```sh
npm test
```

Testele verifica datele, schimbarea zilei la miezul noptii in Romania, fotografiile unice, integritatea continutului si dimensiunile butoanelor pentru mobil.

Resursele personale sunt fisiere statice in repository si pot fi accesate direct de cine are acces la hosting. Blocarea zilelor controleaza interfata folosind data dispozitivului.
