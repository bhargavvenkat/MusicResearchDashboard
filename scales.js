document.addEventListener('DOMContentLoaded', () => {

    const scaleListContainer = document.getElementById('scale-list-container');
    const searchInput = document.getElementById('scale-search');

    if (!scaleListContainer) return;

    // Placeholder for audio functionality
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx;
    if (AudioContext) {
        audioCtx = new AudioContext();
    }
    
    // Maps flats to sharps for keyboard dot mapping
    const noteAliasMap = {
        'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
    };

    // All 102 scales with complete data
    const scalesData = [
        {no: '1', raga: 'Kanakangi', westernScale: '', carnaticAsc: 'S R1 G1 M1 P D1 N1 S', carnaticDesc: 'S N1 D1 P M1 G1 R1 S', westernAsc: 'C Db D F G Ab A', westernDesc: 'C A Ab G F D Db'},
        {no: '2', raga: 'Rathnangi', westernScale: '', carnaticAsc: 'S R1 G1 M1 P D1 N2 S', carnaticDesc: 'S N2 D1 P M1 G1 R1 S', westernAsc: 'C Db D F G Ab Bb', westernDesc: 'C Bb Ab G F D Db'},
        {no: '3', raga: 'Ganamurthi', westernScale: '', carnaticAsc: 'S R1 G1 M1 P D1 N3 S', carnaticDesc: 'S N3 D1 P M1 G1 R1 S', westernAsc: 'C Db D F G Ab B', westernDesc: 'C B Ab G F D Db'},
        {no: '4', raga: 'Vanaspathi', westernScale: '', carnaticAsc: 'S R1 G1 M1 P D2 N2 S', carnaticDesc: 'S N2 D2 P M1 G1 R1 S', westernAsc: 'C Db D F G A Bb', westernDesc: 'C Bb A G F D Db'},
        {no: '5', raga: 'Manavathi', westernScale: '', carnaticAsc: 'S R1 G1 M1 P D2 N3 S', carnaticDesc: 'S N3 D2 P M1 G1 R1 S', westernAsc: 'C Db D F G A B', westernDesc: 'C B A G F D Db'},
        {no: '6', raga: 'Thanarupi', westernScale: '', carnaticAsc: 'S R1 G1 M1 P D3 N3 S', carnaticDesc: 'S N3 D3 P M1 G1 R1 S', westernAsc: 'C Db D F G Bb B', westernDesc: 'C B Bb G F D Db'},
        {no: '7', raga: 'Senavathi', westernScale: '', carnaticAsc: 'S R1 G2 M1 P D1 N1 S', carnaticDesc: 'S N1 D1 P M1 G2 R1 S', westernAsc: 'C Db Eb F G Ab A', westernDesc: 'C A Ab G F Eb Db'},
        {no: '8', raga: 'Hanumathodi', westernScale: '', carnaticAsc: 'S R1 G2 M1 P D1 N2 S', carnaticDesc: 'S N2 D1 P M1 G2 R1 S', westernAsc: 'C Db Eb F G Ab Bb', westernDesc: 'C Bb Ab G F Eb Db'},
        {no: '9', raga: 'Dhenuka', westernScale: '', carnaticAsc: 'S R1 G2 M1 P D1 N3 S', carnaticDesc: 'S N3 D1 P M1 G2 R1 S', westernAsc: 'C Db Eb F G Ab B', westernDesc: 'C B Ab G F Eb Db'},
        {no: '10', raga: 'Natakapriya', westernScale: '', carnaticAsc: 'S R1 G2 M1 P D2 N2 S', carnaticDesc: 'S N2 D2 P M1 G2 R1 S', westernAsc: 'C Db Eb F G A Bb', westernDesc: 'C Bb A G F Eb Db'},
        {no: '11', raga: 'Kokilapriya', westernScale: '', carnaticAsc: 'S R1 G2 M1 P D2 N3 S', carnaticDesc: 'S N3 D2 P M1 G2 R1 S', westernAsc: 'C Db Eb F G A B', westernDesc: 'C B A G F Eb Db'},
        {no: '12', raga: 'Rupavathi', westernScale: '', carnaticAsc: 'S R1 G2 M1 P D3 N3 S', carnaticDesc: 'S N3 D3 P M1 G2 R1 S', westernAsc: 'C Db Eb F G Bb B', westernDesc: 'C B Bb G F Eb Db'},
        {no: '13', raga: 'Gayakapriya', westernScale: '', carnaticAsc: 'S R1 G3 M1 P D1 N1 S', carnaticDesc: 'S N1 D1 P M1 G3 R1 S', westernAsc: 'C Db E F G Ab A', westernDesc: 'C A Ab G F E Db'},
        {no: '14', raga: 'Vakulabharanam', westernScale: '', carnaticAsc: 'S R1 G3 M1 P D1 N2 S', carnaticDesc: 'S N2 D1 P M1 G3 R1 S', westernAsc: 'C Db E F G Ab Bb', westernDesc: 'C Bb Ab G F E Db'},
        {no: '15', raga: 'Mayamalavagowla', westernScale: 'Double Harmonic Major', carnaticAsc: 'S R1 G3 M1 P D1 N3 S', carnaticDesc: 'S N3 D1 P M1 G3 R1 S', westernAsc: 'C Db E F G Ab B', westernDesc: 'C B Ab G F E Db'},
        {no: '16', raga: 'Chakravakam', westernScale: '', carnaticAsc: 'S R1 G3 M1 P D2 N2 S', carnaticDesc: 'S N2 D2 P M1 G3 R1 S', westernAsc: 'C Db E F G A Bb', westernDesc: 'C Bb A G F E Db'},
        {no: '17', raga: 'Suryakantam', westernScale: '', carnaticAsc: 'S R1 G3 M1 P D2 N3 S', carnaticDesc: 'S N3 D2 P M1 G3 R1 S', westernAsc: 'C Db E F G A B', westernDesc: 'C B A G F E Db'},
        {no: '18', raga: 'Hatakambari', westernScale: '', carnaticAsc: 'S R1 G3 M1 P D3 N3 S', carnaticDesc: 'S N3 D3 P M1 G3 R1 S', westernAsc: 'C Db E F G Bb B', westernDesc: 'C B Bb G F E Db'},
        {no: '19', raga: 'Jankaradhvani', westernScale: '', carnaticAsc: 'S R2 G2 M1 P D1 N1 S', carnaticDesc: 'S N1 D1 P M1 G2 R2 S', westernAsc: 'C D Eb F G Ab A', westernDesc: 'C A Ab G F Eb D'},
        {no: '20', raga: 'Natabhairavi', westernScale: 'Natural Minor', carnaticAsc: 'S R2 G2 M1 P D1 N2 S', carnaticDesc: 'S N2 D1 P M1 G2 R2 S', westernAsc: 'C D Eb F G Ab Bb', westernDesc: 'C Bb Ab G F Eb D'},
        {no: '21', raga: 'Keeravani', westernScale: 'Harmonic Minor', carnaticAsc: 'S R2 G2 M1 P D1 N3 S', carnaticDesc: 'S N3 D1 P M1 G2 R2 S', westernAsc: 'C D Eb F G Ab B', westernDesc: 'C B Ab G F Eb D'},
        {no: '22', raga: 'Karaharapriya', westernScale: '', carnaticAsc: 'S R2 G2 M1 P D2 N2 S', carnaticDesc: 'S N2 D2 P M1 G2 R2 S', westernAsc: 'C D Eb F G A Bb', westernDesc: 'C Bb A G F Eb D'},
        {no: '23', raga: 'Gowrimanohari', westernScale: 'Melodic Minor', carnaticAsc: 'S R2 G2 M1 P D2 N3 S', carnaticDesc: 'S N3 D2 P M1 G2 R2 S', westernAsc: 'C D Eb F G A B', westernDesc: 'C B A G F Eb D'},
        {no: '24', raga: 'Varunapriya', westernScale: '', carnaticAsc: 'S R2 G2 M1 P D3 N3 S', carnaticDesc: 'S N3 D3 P M1 G2 R2 S', westernAsc: 'C D Eb F G Bb B', westernDesc: 'C B Bb G F Eb D'},
        {no: '25', raga: 'Mararanjani', westernScale: '', carnaticAsc: 'S R2 G3 M1 P D1 N1 S', carnaticDesc: 'S N1 D1 P M1 G3 R2 S', westernAsc: 'C D E F G Ab A', westernDesc: 'C A Ab G F E D'},
        {no: '26', raga: 'Charukeshi', westernScale: '', carnaticAsc: 'S R2 G3 M1 P D1 N2 S', carnaticDesc: 'S N2 D1 P M1 G3 R2 S', westernAsc: 'C D E F G Ab Bb', westernDesc: 'C Bb Ab G F E D'},
        {no: '27', raga: 'Sarasangi', westernScale: 'Harmonic Major', carnaticAsc: 'S R2 G3 M1 P D1 N3 S', carnaticDesc: 'S N3 D1 P M1 G3 R2 S', westernAsc: 'C D E F G Ab B', westernDesc: 'C B Ab G F E D'},
        {no: '28', raga: 'Harikambhoji', westernScale: 'Mixolydian', carnaticAsc: 'S R2 G3 M1 P D2 N2 S', carnaticDesc: 'S N2 D2 P M1 G3 R2 S', westernAsc: 'C D E F G A Bb', westernDesc: 'C Bb A G F E D'},
        {no: '29', raga: 'Dhirashankarabharnam', westernScale: 'Major', carnaticAsc: 'S R2 G3 M1 P D2 N3 S', carnaticDesc: 'S N3 D2 P M1 G3 R2 S', westernAsc: 'C D E F G A B', westernDesc: 'C B A G F E D'},
        {no: '30', raga: 'Naganandhini', westernScale: '', carnaticAsc: 'S R2 G3 M1 P D3 N3 S', carnaticDesc: 'S N3 D3 P M1 G3 R2 S', westernAsc: 'C D E F G Bb B', westernDesc: 'C B Bb G F E D'},
        {no: '31', raga: 'Yagapriya', westernScale: '', carnaticAsc: 'S R3 G3 M1 P D1 N1 S', carnaticDesc: 'S N1 D1 P M1 G3 R3 S', westernAsc: 'C Eb E F G Ab A', westernDesc: 'C A Ab G F E Eb'},
        {no: '32', raga: 'Ragavardhani', westernScale: '', carnaticAsc: 'S R3 G3 M1 P D1 N2 S', carnaticDesc: 'S N2 D1 P M1 G3 R3 S', westernAsc: 'C Eb E F G Ab Bb', westernDesc: 'C Bb Ab G F E Eb'},
        {no: '33', raga: 'Gangeyabhushani', westernScale: '', carnaticAsc: 'S R3 G3 M1 P D1 N3 S', carnaticDesc: 'S N3 D1 P M1 G3 R3 S', westernAsc: 'C Eb E F G Ab B', westernDesc: 'C B Ab G F E Eb'},
        {no: '34', raga: 'Vagadhisvari', westernScale: '', carnaticAsc: 'S R3 G3 M1 P D2 N2 S', carnaticDesc: 'S N2 D2 P M1 G3 R3 S', westernAsc: 'C Eb E F G A Bb', westernDesc: 'C Bb A G F E Eb'},
        {no: '35', raga: 'Shulini', westernScale: '', carnaticAsc: 'S R3 G3 M1 P D2 N3 S', carnaticDesc: 'S N3 D2 P M1 G3 R3 S', westernAsc: 'C Eb E F G A B', westernDesc: 'C B A G F E Eb'},
        {no: '36', raga: 'Chalanata', westernScale: '', carnaticAsc: 'S R3 G3 M1 P D3 N3 S', carnaticDesc: 'S N3 D3 P M1 G3 R3 S', westernAsc: 'C Eb E F G Bb B', westernDesc: 'C B Bb G F E Eb'},
        {no: '37', raga: 'Salagam', westernScale: '', carnaticAsc: 'S R1 G1 M2 P D1 N1 S', carnaticDesc: 'S N1 D1 P M2 G1 R1 S', westernAsc: 'C Db D F# G Ab A', westernDesc: 'C A Ab G F# D Db'},
        {no: '38', raga: 'Jalarnavam', westernScale: '', carnaticAsc: 'S R1 G1 M2 P D1 N2 S', carnaticDesc: 'S N2 D1 P M2 G1 R1 S', westernAsc: 'C Db D F# G Ab Bb', westernDesc: 'C Bb Ab G F# D Db'},
        {no: '39', raga: 'Jhalavarali', westernScale: '', carnaticAsc: 'S R1 G1 M2 P D1 N3 S', carnaticDesc: 'S N3 D1 P M2 G1 R1 S', westernAsc: 'C Db D F# G Ab B', westernDesc: 'C B Ab G F# D Db'},
        {no: '40', raga: 'Navanitham', westernScale: '', carnaticAsc: 'S R1 G1 M2 P D2 N2 S', carnaticDesc: 'S N2 D2 P M2 G1 R1 S', westernAsc: 'C Db D F# G A Bb', westernDesc: 'C Bb A G F# D Db'},
        {no: '41', raga: 'Pavani', westernScale: '', carnaticAsc: 'S R1 G1 M2 P D2 N3 S', carnaticDesc: 'S N3 D2 P M2 G1 R1 S', westernAsc: 'C Db D F# G A B', westernDesc: 'C B A G F# D Db'},
        {no: '42', raga: 'Raghupriya', westernScale: '', carnaticAsc: 'S R1 G1 M2 P D3 N3 S', carnaticDesc: 'S N3 D3 P M2 G1 R1 S', westernAsc: 'C Db D F# G Bb B', westernDesc: 'C B Bb G F# D Db'},
        {no: '43', raga: 'Gavambodhi', westernScale: '', carnaticAsc: 'S R1 G2 M2 P D1 N1 S', carnaticDesc: 'S N1 D1 P M2 G2 R1 S', westernAsc: 'C Db Eb F# G Ab A', westernDesc: 'C A Ab G F# Eb Db'},
        {no: '44', raga: 'Bhavapriya', westernScale: '', carnaticAsc: 'S R1 G2 M2 P D1 N2 S', carnaticDesc: 'S N2 D1 P M2 G2 R1 S', westernAsc: 'C Db Eb F# G Ab Bb', westernDesc: 'C Bb Ab G F# Eb Db'},
        {no: '45', raga: 'Shubhapanthuvarali', westernScale: '', carnaticAsc: 'S R1 G2 M2 P D1 N3 S', carnaticDesc: 'S N3 D1 P M2 G2 R1 S', westernAsc: 'C Db Eb F# G Ab B', westernDesc: 'C B Ab G F# Eb Db'},
        {no: '46', raga: 'Shadhvidha Margini', westernScale: '', carnaticAsc: 'S R1 G2 M2 P D2 N2 S', carnaticDesc: 'S N2 D2 P M2 G2 R1 S', westernAsc: 'C Db Eb F# G A Bb', westernDesc: 'C Bb A G F# Eb Db'},
        {no: '47', raga: 'Suvarnangi', westernScale: '', carnaticAsc: 'S R1 G2 M2 P D2 N3 S', carnaticDesc: 'S N3 D2 P M2 G2 R1 S', westernAsc: 'C Db Eb F# G A B', westernDesc: 'C B A G F# Eb Db'},
        {no: '48', raga: 'Divyamani', westernScale: '', carnaticAsc: 'S R1 G2 M2 P D3 N3 S', carnaticDesc: 'S N3 D3 P M2 G2 R1 S', westernAsc: 'C Db Eb F# G Bb B', westernDesc: 'C B Bb G F# Eb Db'},
        {no: '49', raga: 'Dhavalambari', westernScale: '', carnaticAsc: 'S R1 G3 M2 P D1 N1 S', carnaticDesc: 'S N1 D1 P M2 G3 R1 S', westernAsc: 'C Db E F# G Ab A', westernDesc: 'C A Ab G F# E Db'},
        {no: '50', raga: 'Namanarayani', westernScale: '', carnaticAsc: 'S R1 G3 M2 P D1 N2 S', carnaticDesc: 'S N2 D1 P M2 G3 R1 S', westernAsc: 'C Db E F# G Ab Bb', westernDesc: 'C Bb Ab G F# E Db'},
        {no: '51', raga: 'Kamavardhini', westernScale: '', carnaticAsc: 'S R1 G3 M2 P D1 N3 S', carnaticDesc: 'S N3 D1 P M2 G3 R1 S', westernAsc: 'C Db E F# G Ab B', westernDesc: 'C B Ab G F# E Db'},
        {no: '52', raga: 'Ramapriya', westernScale: '', carnaticAsc: 'S R1 G3 M2 P D2 N2 S', carnaticDesc: 'S N2 D2 P M2 G3 R1 S', westernAsc: 'C Db E F# G A Bb', westernDesc: 'C Bb A G F# E Db'},
        {no: '53', raga: 'Gamanashrama', westernScale: '', carnaticAsc: 'S R1 G3 M2 P D2 N3 S', carnaticDesc: 'S N3 D2 P M2 G3 R1 S', westernAsc: 'C Db E F# G A B', westernDesc: 'C B A G F# E Db'},
        {no: '54', raga: 'Vishvambhari', westernScale: '', carnaticAsc: 'S R1 G3 M2 P D3 N3 S', carnaticDesc: 'S N3 D3 P M2 G3 R1 S', westernAsc: 'C Db E F# G Bb B', westernDesc: 'C B Bb G F# E Db'},
        {no: '55', raga: 'Shyamalangi', westernScale: '', carnaticAsc: 'S R2 G2 M2 P D1 N1 S', carnaticDesc: 'S N1 D1 P M2 G2 R2 S', westernAsc: 'C D Eb F# G Ab A', westernDesc: 'C A Ab G F# Eb D'},
        {no: '56', raga: 'Shanmukhapriya', westernScale: '', carnaticAsc: 'S R2 G2 M2 P D1 N2 S', carnaticDesc: 'S N2 D1 P M2 G2 R2 S', westernAsc: 'C D Eb F# G Ab Bb', westernDesc: 'C Bb Ab G F# Eb D'},
        {no: '57', raga: 'Simhendra Madhyamam', westernScale: '', carnaticAsc: 'S R2 G2 M2 P D1 N3 S', carnaticDesc: 'S N3 D1 P M2 G2 R2 S', westernAsc: 'C D Eb F# G Ab B', westernDesc: 'C B Ab G F# Eb D'},
        {no: '58', raga: 'Hemavathi', westernScale: '', carnaticAsc: 'S R2 G2 M2 P D2 N2 S', carnaticDesc: 'S N2 D2 P M2 G2 R2 S', westernAsc: 'C D Eb F# G A Bb', westernDesc: 'C Bb A G F# Eb D'},
        {no: '59', raga: 'Dharmavathi', westernScale: '', carnaticAsc: 'S R2 G2 M2 P D2 N3 S', carnaticDesc: 'S N3 D2 P M2 G2 R2 S', westernAsc: 'C D Eb F# G A B', westernDesc: 'C B A G F# Eb D'},
        {no: '60', raga: 'Nithimathi', westernScale: '', carnaticAsc: 'S R2 G2 M2 P D3 N3 S', carnaticDesc: 'S N3 D3 P M2 G2 R2 S', westernAsc: 'C D Eb F# G Bb B', westernDesc: 'C B Bb G F# Eb D'},
        {no: '61', raga: 'Kanthamani', westernScale: '', carnaticAsc: 'S R2 G3 M2 P D1 N1 S', carnaticDesc: 'S N1 D1 P M2 G3 R2 S', westernAsc: 'C D E F# G Ab A', westernDesc: 'C A Ab G F# E D'},
        {no: '62', raga: 'Rishabhapriya', westernScale: '', carnaticAsc: 'S R2 G3 M2 P D1 N2 S', carnaticDesc: 'S N2 D1 P M2 G3 R2 S', westernAsc: 'C D E F# G Ab Bb', westernDesc: 'C Bb Ab G F# E D'},
        {no: '63', raga: 'Lathangi', westernScale: '', carnaticAsc: 'S R2 G3 M2 P D1 N3 S', carnaticDesc: 'S N3 D1 P M2 G3 R2 S', westernAsc: 'C D E F# G Ab B', westernDesc: 'C B Ab G F# E D'},
        {no: '64', raga: 'Vachaspathi', westernScale: '', carnaticAsc: 'S R2 G3 M2 P D2 N2 S', carnaticDesc: 'S N2 D2 P M2 G3 R2 S', westernAsc: 'C D E F# G A Bb', westernDesc: 'C Bb A G F# E D'},
        {no: '65', raga: 'Mechakalyani', westernScale: '', carnaticAsc: 'S R2 G3 M2 P D2 N3 S', carnaticDesc: 'S N3 D2 P M2 G3 R2 S', westernAsc: 'C D E F# G A B', westernDesc: 'C B A G F# E D'},
        {no: '66', raga: 'Chithrambari', westernScale: '', carnaticAsc: 'S R2 G3 M2 P D3 N3 S', carnaticDesc: 'S N3 D3 P M2 G3 R2 S', westernAsc: 'C D E F# G Bb B', westernDesc: 'C B Bb G F# E D'},
        {no: '67', raga: 'Sucharithra', westernScale: '', carnaticAsc: 'S R3 G3 M2 P D1 N1 S', carnaticDesc: 'S N1 D1 P M2 G3 R3 S', westernAsc: 'C Eb E F# G Ab A', westernDesc: 'C A Ab G F# E Eb'},
        {no: '68', raga: 'Jyothiswarupini', westernScale: '', carnaticAsc: 'S R3 G3 M2 P D1 N2 S', carnaticDesc: 'S N2 D1 P M2 G3 R3 S', westernAsc: 'C Eb E F# G Ab Bb', westernDesc: 'C Bb Ab G F# E Eb'},
        {no: '69', raga: 'Dhatuvardhani', westernScale: '', carnaticAsc: 'S R3 G3 M2 P D1 N3 S', carnaticDesc: 'S N3 D1 P M2 G3 R3 S', westernAsc: 'C Eb E F# G Ab B', westernDesc: 'C B Ab G F# E Eb'},
        {no: '70', raga: 'Nasika Bhushani', westernScale: '', carnaticAsc: 'S R3 G3 M2 P D2 N2 S', carnaticDesc: 'S N2 D2 P M2 G3 R3 S', westernAsc: 'C Eb E F# G A Bb', westernDesc: 'C Bb A G F# E Eb'},
        {no: '71', raga: 'Kosalam', westernScale: '', carnaticAsc: 'S R3 G3 M2 P D2 N3 S', carnaticDesc: 'S N3 D2 P M2 G3 R3 S', westernAsc: 'C Eb E F# G A B', westernDesc: 'C B A G F# E Eb'},
        {no: '72', raga: 'Rasikapriya', westernScale: '', carnaticAsc: 'S R3 G3 M2 P D3 N3 S', carnaticDesc: 'S N3 D3 P M2 G3 R3 S', westernAsc: 'C Eb E F# G Bb B', westernDesc: 'C B Bb G F# E Eb'},
        {no: '73', raga: '-', westernScale: 'Major Blues', carnaticAsc: 'S R2 G2 G3 P D2 S', carnaticDesc: 'S D2 P G3 G2 R2 S', westernAsc: 'C D Eb E G A', westernDesc: 'C A G E Eb D'},
        {no: '74', raga: '-', westernScale: 'Minor Blues', carnaticAsc: 'S G2 M1 M2 P N2 S', carnaticDesc: 'S N2 P M2 M1 G2 S', westernAsc: 'C Eb F F# G Bb', westernDesc: 'C Bb G F# F Eb'},
        {no: '75', raga: 'Mohanam', westernScale: 'Major Pentatonic', carnaticAsc: 'S R2 G3 P D2 S', carnaticDesc: 'S D2 P G3 R2 S', westernAsc: 'C D E G A', westernDesc: 'C A G E D'},
        {no: '76', raga: 'Shuddha Dhanyasi', westernScale: 'Minor Pentatonic', carnaticAsc: 'S G2 M1 P N2 S', carnaticDesc: 'S N2 P M1 G2 S', westernAsc: 'C Eb F G Bb', westernDesc: 'C Bb G F Eb'},
        {no: '77', raga: 'Abheri', westernScale: 'Minor Pentatonic / Dorian Mode', carnaticAsc: 'S G2 M1 P N2 S', carnaticDesc: 'S N2 D2 P M1 G2 R2 S', westernAsc: 'C Eb F G Bb', westernDesc: 'C Bb A G F Eb D'},
        {no: '78', raga: 'Brindavana Saranga', westernScale: 'Hexatonic with variable 7th', carnaticAsc: 'S R2 M1 P N3 S', carnaticDesc: 'S N2 P M1 R2 S', westernAsc: 'C D F G B', westernDesc: 'C Bb G F D'},
        {no: '79', raga: 'Hamsadhwani', westernScale: 'Major Pentatonic (Ionian without 4th & 6th)', carnaticAsc: 'S R2 G3 P N3 S', carnaticDesc: 'S N3 P G3 R2 S', westernAsc: 'C D E G B', westernDesc: 'C B G E D'},
        {no: '80', raga: 'Amruthavarshini', westernScale: 'Lydian Pentatonic', carnaticAsc: 'S G3 M2 P N3 S', carnaticDesc: 'S N3 P M2 G3 S', westernAsc: 'C E F# G B', westernDesc: 'C B G F# E'},
        {no: '81', raga: 'Anandabhairavi', westernScale: '', carnaticAsc: 'S G2 R2 G2 M1 P D2 P S', carnaticDesc: 'S N2 D2 P M1 G2 R2 S', westernAsc: 'C Eb D Eb F G A G', westernDesc: 'C Bb A G F Eb D'},
        {no: '82', raga: 'Kapi', westernScale: 'Dorian Mode with extensive chromaticism', carnaticAsc: 'S R2 M1 P N3 S', carnaticDesc: 'S N2 D2 P M1 G2 R2 S', westernAsc: 'C D F G B', westernDesc: 'C Bb A G F Eb D'},
        {no: '83', raga: 'Madhyamavati', westernScale: 'Dorian Pentatonic', carnaticAsc: 'S R2 M1 P N2 S', carnaticDesc: 'S N2 P M1 R2 S', westernAsc: 'C D F G Bb', westernDesc: 'C Bb G F D'},
        {no: '84', raga: 'Behag', westernScale: '', carnaticAsc: 'S G3 M1 P N3 D2 N3 S', carnaticDesc: 'S N3 D2 P M2 P G3 M1 R2 S', westernAsc: 'C E F G B A B', westernDesc: 'C B A G F# G E F D'},
        {no: '85', raga: 'Reethigowla', westernScale: '', carnaticAsc: 'S G2 R2 G2 M1 N2 D2 M1 N2 S', carnaticDesc: 'S N2 D2 M1 G2 R2 S', westernAsc: 'C Eb D Eb F Bb A F Bb', westernDesc: 'C Bb A F Eb D'},
        {no: '86', raga: 'Hindolam', westernScale: '', carnaticAsc: 'S G2 M1 D1 N2 S', carnaticDesc: 'S N2 D1 M1 G2 S', westernAsc: 'C Eb F Ab Bb', westernDesc: 'C Bb Ab F Eb'},
        {no: '87', raga: 'Bilahari', westernScale: '', carnaticAsc: 'S R2 G3 P D2 S', carnaticDesc: 'S N3 D2 P M1 G3 R2 S', westernAsc: 'C D E G A', westernDesc: 'C B A G F E D'},
        {no: '88', raga: 'Valaji', westernScale: 'Mixolydian Pentatonic', carnaticAsc: 'S G3 P D2 N2 S', carnaticDesc: 'S N2 D2 P G3 S', westernAsc: 'C E G A Bb', westernDesc: 'C Bb A G E'},
        {no: '89', raga: 'Begada', westernScale: '', carnaticAsc: 'S G3 R2 G3 M1 P D2 P S', carnaticDesc: 'S N3 D2 P M1 G3 R2 S', westernAsc: 'C E D E F G A G', westernDesc: 'C B A G F E D'},
        {no: '90', raga: 'Gambheeranata', westernScale: '', carnaticAsc: 'S G3 M1 P N3 S', carnaticDesc: 'S N3 P M1 G3 S', westernAsc: 'C E F G B', westernDesc: 'C B G F E'},
        {no: '91', raga: 'Nilambari', westernScale: '', carnaticAsc: 'S R2 G3 M1 P D2 P N2 S', carnaticDesc: 'S N2 P D2 P M1 G3 R2 S', westernAsc: 'C D E F G A G Bb', westernDesc: 'C Bb G A G F E D'},
        {no: '92', raga: 'Kedaragowla', westernScale: '', carnaticAsc: 'S R2 M1 P N2 S', carnaticDesc: 'S N2 D2 P M1 G3 R2 S', westernAsc: 'C D F G Bb', westernDesc: 'C Bb A G F D E'},
        {no: '93', raga: 'Desh', westernScale: '', carnaticAsc: 'S R2 M1 P N3 S', carnaticDesc: 'S N2 D2 P M1 G2 R2 S', westernAsc: 'C D F G B', westernDesc: 'C Bb A G F Eb D'},
        {no: '94', raga: 'Kuntalavarali', westernScale: '', carnaticAsc: 'S M1 P N2 S', carnaticDesc: 'S N2 P M1 S', westernAsc: 'C F G Bb', westernDesc: 'C Bb G F'},
        {no: '95', raga: 'Mandari', westernScale: '', carnaticAsc: 'S R2 G3 M2 P S', carnaticDesc: 'S N3 D2 P M2 G3 R2 S', westernAsc: 'C D E F# G', westernDesc: 'C B A G F# E D'},
        {no: '96', raga: 'Saramati', westernScale: '', carnaticAsc: 'S R2 G2 M1 P D1 N2 S', carnaticDesc: 'S N2 D1 P M1 G2 R2 S', westernAsc: 'C D Eb F G Ab Bb', westernDesc: 'C Bb Ab F Eb D'},
        {no: '97', raga: 'Jingla', westernScale: '', carnaticAsc: 'S R2 G2 M1 P D2 N2 S', carnaticDesc: 'S N2 D2 P M1 G2 R2 S', westernAsc: 'C D Eb F G A Bb', westernDesc: 'C Bb A G F Eb D'},
        {no: '98', raga: 'Manirangu', westernScale: '', carnaticAsc: 'S R2 G2 M1 P N2 S', carnaticDesc: 'S N2 P M1 G2 R2 S', westernAsc: 'C D Eb F G Bb', westernDesc: 'C Bb G F Eb D'},
        {no: '99', raga: 'Andolika', westernScale: '', carnaticAsc: 'S R2 G2 M1 D2 N2 S', carnaticDesc: 'S N2 D2 M1 G2 R2 S', westernAsc: 'C D Eb F A Bb', westernDesc: 'C Bb A F Eb D'},
        {no: '100', raga: 'Narayanagowla', westernScale: '', carnaticAsc: 'S R2 M1 P N2 D2 S', carnaticDesc: 'S N2 D2 P M1 G3 R2 S', westernAsc: 'C D F G Bb A', westernDesc: 'C Bb A G F E D'},
        {no: '101', raga: 'Chandrajyoti', westernScale: '', carnaticAsc: 'S G3 P D2 S', carnaticDesc: 'S D2 P G3 S', westernAsc: 'C E G A', westernDesc: 'C A G E'},
        {no: '102', raga: 'Rudrapriya', westernScale: '', carnaticAsc: 'S R2 M1 P D2 N2 S', carnaticDesc: 'S N2 D2 P M1 R2 S', westernAsc: 'C D F G A Bb', westernDesc: 'C Bb A G F D'}
    ];
    
    // Generates the HTML for a single miniature keyboard with dots for a given scale
    function generateMiniKeyboardHTML(scale) {
        // Get all unique notes from both ascending and descending scales, stripping the octave 'C'
        const ascNotes = scale.westernAsc.split(' ').slice(0, -1);
        const descNotes = scale.westernDesc.split(' ').slice(0, -1);
        const uniqueNotes = [...new Set([...ascNotes, ...descNotes])];
        
        let keyboardHTML = `<div class="mini-keyboard-wrapper">`;
        keyboardHTML += '<div class="mini-keyboard-container">';
        
        // White keys
        for (const key of ['C', 'D', 'E', 'F', 'G', 'A', 'B']) {
            const hasDot = uniqueNotes.includes(key);
            keyboardHTML += `<div class="mini-key mini-white ${hasDot ? 'has-dot' : ''}" data-note="${key}"></div>`;
        }
        // Black keys
        for (const key of ['C#', 'D#', 'F#', 'G#', 'A#']) {
            const hasDot = uniqueNotes.includes(key) || uniqueNotes.some(note => noteAliasMap[note] === key);
            keyboardHTML += `<div class="mini-key mini-black ${hasDot ? 'has-dot' : ''}" data-note="${key}"></div>`;
        }
        
        keyboardHTML += '</div></div>'; // Close container and wrapper
        return keyboardHTML;
    }

    // Renders all the scales into the container
    function renderScales(scales) {
        if (!scales || scales.length === 0) {
            scaleListContainer.innerHTML = '<div class="card-placeholder">No scales found.</div>';
            return;
        }

        let html = '';
        for (const scale of scales) {
            const ragaName = scale.raga === '-' ? scale.westernScale : scale.raga;
            const westernName = scale.raga !== '-' && scale.westernScale ? `<span class="scale-meta">${scale.westernScale}</span>` : '';
            const ragaNumberHTML = parseInt(scale.no) <= 72 ? `<span class="raga-number">#${scale.no}</span>` : '';
            const keyboardHTML = generateMiniKeyboardHTML(scale);

            html += `
            <div class="composer-card scale-card" data-search-terms="${scale.no} ${ragaName.toLowerCase()} ${scale.westernScale.toLowerCase()}">
                <div class="card-header">
                    ${ragaNumberHTML}
                    <div class="card-title">
                        <h2>${ragaName}</h2>
                        ${westernName}
                    </div>
                </div>
                
                <div class="note-display-section">
                    <div class="scale-column">
                        <h3>Ascending</h3>
                        <p class="carnatic-notes">${scale.carnaticAsc}</p>
                        <p class="western-notes-display">${scale.westernAsc}</p>
                    </div>
                    <div class="scale-column">
                        <h3>Descending</h3>
                        <p class="carnatic-notes">${scale.carnaticDesc}</p>
                        <p class="western-notes-display">${scale.westernDesc}</p>
                    </div>
                </div>

                ${keyboardHTML}
                
                <button class="listen-btn play-scale-btn" data-scale-notes="${scale.westernAsc}">Play Scale</button>
            </div>`;
        }
        scaleListContainer.innerHTML = html;
    }

    // Placeholder for audio playback
    function playScaleNotes(notesString) {
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        console.log("Audio playback is not implemented. Notes:", notesString);
        alert("Audio playback for this view is not implemented yet.");
    }
    
    // Main event listener for play button
    scaleListContainer.addEventListener('click', (e) => {
        const playButton = e.target.closest('.play-scale-btn');
        if (playButton) {
            e.stopPropagation();
            const notes = playButton.dataset.scaleNotes;
            playScaleNotes(notes);
        }
    });

    // Search functionality
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        document.querySelectorAll('.scale-card').forEach(card => {
            const searchTerms = card.dataset.searchTerms;
            if (searchTerms.includes(searchTerm)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });

    // Initial render
    renderScales(scalesData);
});