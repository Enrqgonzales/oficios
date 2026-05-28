/**
 * ubigeo.js - Datos geográficos del Perú y lógica de selectores en cascada.
 * Este archivo alimenta los selectores #departamento, #provincia y #distrito
 * usados en index.html y registro.html.
 */

// ---------------------------------------------------------------------------
// BLOQUE A: Dataset estático de Perú (departamentos, provincias y distritos)
// ---------------------------------------------------------------------------
const DATOS_UBIGEO_PERU = {
  'Amazonas': {
    'Chachapoyas': ['Chachapoyas', 'Asunción', 'Balsas', 'Cheto', 'Leimebamba', 'San Francisco de Daguas'],
    'Bagua': ['Bagua', 'Aramango', 'Copallín', 'El Parco', 'Imaza', 'La Peca'],
    'Bongará': ['Jumbilla', 'Chisquilla', 'Corosha', 'Cuispes', 'Florida', 'Recta'],
    'Condorcanqui': ['Santa María de Nieva', 'El Cenepa', 'Río Santiago'],
    'Luya': ['Lamud', 'Camporredondo', 'Cocabamba', 'Inguilpata', 'Longuita', 'San Cristóbal'],
    'Rodríguez de Mendoza': ['Mendoza', 'Chirimoto', 'Cochamal', 'Huambo', 'Limabamba', 'Mariscal Benavides'],
    'Utcubamba': ['Bagua Grande', 'Cajaruro', 'Cumba', 'El Milagro', 'Jamalca', 'Yamón']
  },
  'Áncash': {
    'Huaraz': ['Huaraz', 'Cochabamba', 'Colcabamba', 'Independencia', 'Jangas', 'Olleros', 'Tarica'],
    'Aija': ['Aija', 'Coris', 'Huacllán', 'La Merced', 'Succha'],
    'Antonio Raymondi': ['Llamellín', 'Aczo', 'Chaccho', 'Chingas', 'Mirgas', 'San Juan de Rontoy'],
    'Asunción': ['Chacas', 'Acochaca', 'Chaccho', 'Huari', 'Huallanca', 'Masma'],
    'Bolognesi': ['Chiquián', 'Abelardo Pardo Lezameta', 'Antonio Raymondi', 'Aquia', 'Cajacay', 'Canis'],
    'Carhuaz': ['Carhuaz', 'Acopampa', 'Amashca', 'Anta', 'Ataquero', 'Marcara', 'Pariahuanca'],
    'Casma': ['Casma', 'Buena Vista Alta', 'Comandante Noel', 'Yaután'],
    'Huari': ['Huari', 'Anra', 'Cajay', 'Chavín de Huántar', 'Huacachi', 'Huacchis', 'Masin'],
    'Huarmey': ['Huarmey', 'Cochapeti', 'Culebras', 'Huayan', 'Malvas'],
    'Santa': ['Chimbote', 'Cáceres del Perú', 'Coishco', 'Macate', 'Moro', 'Nepeña', 'Nuevo Chimbote', 'Samanco'],
    'Yungay': ['Yungay', 'Cascapara', 'Mancos', 'Matacoto', 'Quillo', 'Ranrahirca', 'Shupluy']
  },
  'Apurímac': {
    'Abancay': ['Abancay', 'Chacoche', 'Circa', 'Curahuasi', 'Huanipaca', 'Lambrama', 'Pichirhua'],
    'Andahuaylas': ['Andahuaylas', 'Andarapa', 'Chiara', 'Huancarama', 'Huancaray', 'Kishuara', 'San Jerónimo', 'Talavera'],
    'Antabamba': ['Antabamba', 'El Oro', 'Huaquirca', 'Juan Espinoza Medrano', 'Oropesa', 'Sabaino'],
    'Aymaraes': ['Chalhuanca', 'Capaya', 'Caraybamba', 'Chapimarca', 'Colcabamba', 'Cotaruse', 'Ihuayllo'],
    'Chincheros': ['Chincheros', 'Anco-Huallo', 'Cocharcas', 'Huaccana', 'Ocobamba', 'Ranracancha'],
    'Cotabambas': ['Tambobamba', 'Cotabambas', 'Coyllurqui', 'Haquira', 'Mara', 'Mara Rosa'],
    'Grau': ['Chuquibambilla', 'Curasco', 'Curpahuasi', 'Gamarra', 'Huayllati', 'Mamara', 'Pataypampa']
  },
  'Arequipa': {
    'Arequipa': ['Arequipa', 'Alto Selva Alegre', 'Cayma', 'Cerro Colorado', 'Characato', 'Jacobo Hunter', 'Miraflores', 'Sachaca', 'Yanahuara'],
    'Camaná': ['Camaná', 'José María Quimper', 'Mariano Nicolás Valcárcel', 'Nicolás de Piérola', 'Ocoña', 'Quilca'],
    'Caravelí': ['Caravelí', 'Acarí', 'Atico', 'Bella Unión', 'Cahuacho', 'Chala', 'Huanuhuanu'],
    'Castilla': ['Aplao', 'Andagua', 'Ayo', 'Chachas', 'Chilcaymarca', 'Machaguay', 'Orcopampa', 'Viraco'],
    'Caylloma': ['Chivay', 'Achoma', 'Cabanaconde', 'Callalli', 'Caylloma', 'Coporaque', 'Lari', 'Majes'],
    'Condesuyos': ['Chuquibamba', 'Andaray', 'Cayarani', 'Chichas', 'Iray', 'Rio Grande', 'Yanque'],
    'Islay': ['Mollendo', 'Cocachacra', 'Dean Valdivia', 'Islay', 'Mejía', 'Punta de Bombón'],
    'La Unión': ['Cotahuasi', 'Alca', 'Charcana', 'Huaynacotas', 'Pampamarca', 'Puyca', 'Tauria', 'Toro']
  },
  'Ayacucho': {
    'Huamanga': ['Ayacucho', 'Acocro', 'Acos Vinchos', 'Carmen Alto', 'Chiara', 'Ocros', 'Pacaycasa', 'Quinua', 'San José de Ticllas'],
    'Cangallo': ['Cangallo', 'Chuschi', 'Los Morochucos', 'María Parado de Bellido', 'Paras', 'Totos'],
    'Huanta': ['Huanta', 'Ayahuanco', 'Huamanguilla', 'Iguain', 'Luricocha', 'Santillana', 'Sivia'],
    'La Mar': ['San Miguel', 'Anco', 'Ayna', 'Chilcas', 'Chungui', 'Luis Carranza', 'San Cristóbal', 'Tambo'],
    'Lucanas': ['Puquio', 'Aucara', 'Cabana', 'Carmen Salcedo', 'Chaviña', 'Chipao', 'Huac-Huas', 'Sancos'],
    'Sucre': ['Querobamba', 'Belén', 'Chalcos', 'Chilcayoc', 'Huacaña', 'Morcolla', 'Paico', 'San Pedro de Larcay'],
    'Víctor Fajardo': ['Huancapi', 'Alcamenca', 'Apongo', 'Asquipata', 'Canaria', 'Cayara', 'Colca', 'Huamanquiquia'],
    'Vilcas Huaman': ['Vilcas Huamán', 'Accomarca', 'Carhuanca', 'Concepción', 'Huambalpa', 'Independencia', 'Saurama', 'Vischongo']
  },
  'Cajamarca': {
    'Cajamarca': ['Cajamarca', 'Asunción', 'Chetilla', 'Cospan', 'Encañada', 'Jesús', 'Llacanora', 'Los Baños del Inca', 'Namora'],
    'Chota': ['Chota', 'Anguia', 'Chadin', 'Chiguirip', 'Chimban', 'Conchán', 'Huambos', 'Lajas', 'Querocoto'],
    'Cutervo': ['Cutervo', 'Callayuc', 'Choros', 'Cujillo', 'La Ramada', 'Pimpingos', 'Querocotillo', 'San Andrés de Cutervo'],
    'Jaén': ['Jaén', 'Bellavista', 'Chontali', 'Colasay', 'Huabal', 'Las Pirias', 'Pomahuaca', 'San Felipe', 'San José del Alto'],
    'San Ignacio': ['San Ignacio', 'Chirinos', 'Huarango', 'La Coipa', 'Namballe', 'San José de Lourdes', 'Tabaconas'],
    'San Marcos': ['San Marcos', 'Chancay', 'Eduardo Villanueva', 'Gregorio Pita', 'Ichocan', 'José Manuel Quiroz', 'San Miguel'],
    'San Miguel': ['San Miguel de Pallaques', 'Bolívar', 'Calquis', 'Catilluc', 'El Prado', 'La Florida', 'Llapa', 'Nanchoc'],
    'San Pablo': ['San Pablo', 'San Bernardino', 'San Luis', 'Tumbaden'],
    'Santa Cruz': ['Santa Cruz de Succhubamba', 'Andabamba', 'Catache', 'Chancaybaños', 'La Esperanza', 'Ninabamba', 'Pulan', 'Saucepampa']
  },
  'Callao': {
    'Callao': ['Callao', 'Bellavista', 'Carmen de la Legua Reynoso', 'La Perla', 'La Punta', 'Mi Perú', 'Ventanilla']
  },
  'Cusco': {
    'Cusco': ['Cusco', 'San Jerónimo', 'San Sebastián', 'Santiago', 'Wanchaq', 'Ccorca', 'Poroy', 'Saylla'],
    'Calca': ['Calca', 'Coya', 'Lamay', 'Lares', 'Pisac', 'San Salvador', 'Taray', 'Yanatile'],
    'Canchis': ['Sicuani', 'Checacupe', 'Combapata', 'Marangani', 'Pitumarca', 'San Pablo', 'San Pedro', 'Tupac Amaru'],
    'La Convención': ['Quillabamba', 'Echarate', 'Huayopata', 'Kimbiri', 'Maranura', 'Ocobamba', 'Santa Ana', 'Vilcabamba'],
    'Quispicanchi': ['Urcos', 'Andahuaylillas', 'Camanti', 'Ccarhuayo', 'Ccatca', 'Huaro', 'Lucre', 'Oropesa', 'Urcos'],
    'Urubamba': ['Urubamba', 'Chinchero', 'Huayllabamba', 'Machupicchu', 'Maras', 'Ollantaytambo', 'Yucay']
  },
  'Huancavelica': {
    'Huancavelica': ['Huancavelica', 'Acobambilla', 'Acoria', 'Conayca', 'Cuenca', 'Huachocolpa', 'Huayllahuara', 'Izcuchaca', 'Laria'],
    'Angaraes': ['Lircay', 'Anchonga', 'Callanmarca', 'Ccochaccasa', 'Chincho', 'Congalla', 'Huanca-Huanca', 'San Antonio de Antaparco'],
    'Castrovirreyna': ['Castrovirreyna', 'Arma', 'Aurahua', 'Capillas', 'Chupamarca', 'Cocas', 'Huachos', 'Huamatambo'],
    'Churcampa': ['Churcampa', 'Anco', 'Chinchihuasi', 'El Carmen', 'La Merced', 'Locroja', 'Pachamarca', 'San Miguel de Mayocc'],
    'Tayacaja': ['Pampas', 'Acostambo', 'Acraquia', 'Ahuaycha', 'Colcabamba', 'Daniel Hernández', 'Huachocolpa', 'Huando', 'Palca']
  },
  'Huánuco': {
    'Huánuco': ['Huánuco', 'Amarilis', 'Chinchao', 'Churubamba', 'Margos', 'Pillco Marca', 'Quisqui', 'San Francisco de Cayrán', 'Yacus'],
    'Ambo': ['Ambo', 'Cayna', 'Colpas', 'Conchamarca', 'Huacar', 'San Francisco', 'San Rafael', 'Tomay Kichwa'],
    'Leoncio Prado': ['Rupa-Rupa', 'Daniel Alva Escobar', 'Hermílio Valdizán', 'José Crespo y Castillo', 'Luyando', 'Mariano Dámaso Beraún', 'Pucayacu', 'Tingo María'],
    'Pachitea': ['Panao', 'Chaglla', 'Molino', 'Umari']
  },
  'Ica': {
    'Ica': ['Ica', 'La Tinguiña', 'Los Aquijes', 'Ocucaje', 'Pachacútec', 'Parcona', 'Pueblo Nuevo', 'Salas', 'San José de Los Molinos'],
    'Chincha': ['Chincha Alta', 'Alto Laran', 'Chavín', 'Chincha Baja', 'El Carmen', 'Grocio Prado', 'Pueblo Nuevo', 'San Juan de Yanac', 'Sunampe'],
    'Nazca': ['Nazca', 'Changuillo', 'El Ingenio', 'Marcona', 'Vista Alegre'],
    'Palpa': ['Palpa', 'Llipata', 'Río Grande', 'Santa Cruz', 'Tibillo'],
    'Pisco': ['Pisco', 'Huancano', 'Humay', 'Independencia', 'Paracas', 'San Andrés', 'San Clemente', 'Tupac Amaru Inca']
  },
  'Junín': {
    'Huancayo': ['Huancayo', 'Carhuacallpa', 'Chicche', 'Chilca', 'Chongos Alto', 'Chupaca', 'Colca', 'Cullhuas', 'El Tambo', 'Huacrapuquio', 'Hualhuas', 'Ingenio', 'Pariahuanca', 'Pilcomayo', 'Quichuay', 'Quilcas', 'San Agustín', 'San Jerónimo de Tunán', 'Saño', 'Sapallanga', 'Sicaya', 'Santo Domingo de Acobamba', 'Viques'],
    'Chanchamayo': ['La Merced', 'Chanchamayo', 'Perené', 'Pichanaqui', 'San Luis de Shuaro', 'San Ramón', 'Vitoc'],
    'Jauja': ['Jauja', 'Acolla', 'Apata', 'Ataura', 'Canchayllo', 'Curicaca', 'El Mantaro', 'Huamali', 'Huertas', 'Janjaillo', 'Julcán', 'Leonor Ordóñez', 'Llocllapampa', 'Marco', 'Masma', 'Masma Chicche', 'Molinos', 'Monobamba', 'Muqui', 'Muquiyauyo', 'Paca', 'Paccha', 'Pancan', 'Parco', 'Pomacancha', 'Ricran', 'San Lorenzo', 'San Pedro de Chunan', 'Sausa', 'Sincos', 'Tunan Marca', 'Yauli', 'Yauyos'],
    'Satipo': ['Satipo', 'Coviriali', 'Llaylla', 'Mazamari', 'Pampa Hermosa', 'Pangoa', 'Río Negro', 'Río Tambo', 'Vizcatán del Ene'],
    'Tarma': ['Tarma', 'Acobamba', 'Huaricolca', 'Huasahuasi', 'La Unión', 'Palca', 'Palcamayo', 'San Pedro de Cajas', 'Tapo', 'Ticllos']
  },
  'La Libertad': {
    'Trujillo': ['Trujillo', 'El Porvenir', 'Florencia de Mora', 'Huanchaco', 'La Esperanza', 'Laredo', 'Moche', 'Poroto', 'Salaverry', 'Simbal', 'Victor Larco Herrera'],
    'Ascope': ['Ascope', 'Chicama', 'Chocope', 'Magdalena de Cao', 'Paiján', 'Rázuri', 'Santiago de Cao', 'Casa Grande'],
    'Chepén': ['Chepén', 'Pacanga', 'Pueblo Nuevo'],
    'Pacasmayo': ['San Pedro de Lloc', 'Guadalupe', 'Jequetepeque', 'Pacasmayo', 'San José'],
    'Sánchez Carrión': ['Huamachuco', 'Chugay', 'Cochorco', 'Curgos', 'Marcabal', 'Sanagorán', 'Sartimbamba', 'Santiago de Chuco'],
    'Virú': ['Virú', 'Chao', 'Guadalupito']
  },
  'Lambayeque': {
    'Chiclayo': ['Chiclayo', 'Cayalti', 'Eten', 'Eten Puerto', 'José Leonardo Ortiz', 'La Victoria', 'Lagunas', 'Monsefú', 'Nueva Arica', 'Oyotún', 'Picsi', 'Pimentel', 'Pomalca', 'Pucalá', 'Reque', 'Santa Rosa', 'Saña', 'Tumán'],
    'Ferreñafe': ['Ferreñafe', 'Cañaris', 'Incahuasi', 'Manuel Antonio Mesones Muro', 'Pitipo', 'Pueblo Nuevo'],
    'Lambayeque': ['Lambayeque', 'Chochope', 'Illimo', 'Jayanca', 'Mochumi', 'Morrope', 'Motupe', 'Olmos', 'Pacora', 'Túcume']
  },
  'Lima': {
    'Lima': ['Lima', 'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos', 'Cieneguilla', 'Comas', 'El Agustino', 'Independencia', 'Jesús María', 'La Molina', 'La Victoria', 'Lince', 'Los Olivos', 'Lurigancho', 'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacámac', 'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rímac', 'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores', 'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar', 'Santa Rosa', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo'],
    'Cañete': ['San Vicente de Cañete', 'Asia', 'Calango', 'Cerro Azul', 'Chilca', 'Coayllo', 'Imperial', 'Lunahuaná', 'Mala', 'Nuevo Imperial', 'Pacarán', 'Quilmana', 'San Antonio', 'San Luis', 'Santa Cruz de Flores', 'Zúñiga'],
    'Huaral': ['Huaral', 'Atavillos Alto', 'Atavillos Bajo', 'Aucallama', 'Chancay', 'Ihuari', 'Lampian', 'Pacaraos', 'San Miguel de Acos', 'Santa Cruz de Andamarca', 'Sumbilca', 'Veintisiete de Noviembre'],
    'Huaura': ['Huacho', 'Ámbar', 'Caleta de Carquín', 'Checras', 'Hualmay', 'Huaura', 'Leoncio Prado', 'Paccho', 'Santa Leonor', 'Santa María', 'Sayan', 'Végueta']
  },
  'Loreto': {
    'Maynas': ['Iquitos', 'Alto Nanay', 'Fernando Lores', 'Indiana', 'Las Amazonas', 'Mazán', 'Napo', 'Punchana', 'Putumayo', 'Torres Causana'],
    'Alto Amazonas': ['Yurimaguas', 'Balsapuerto', 'Jeberos', 'Lagunas', 'Santa Cruz', 'Teniente Cesar López Rojas'],
    'Datem del Marañón': ['San Lorenzo', 'Andoas', 'Barranca', 'Cahuapanas', 'Manseriche', 'Morona', 'Pastaza'],
    'Mariscal Ramón Castilla': ['Caballococha', 'Nauta', 'Punchana', 'San Pablo', 'Yaguas']
  },
  'Madre de Dios': {
    'Tambopata': ['Puerto Maldonado', 'Inambari', 'Las Piedras', 'Laberinto'],
    'Manu': ['Salvación', 'Fitzcarrald', 'Huepetuhe', 'Madre de Dios'],
    'Tahuamanu': ['Iñapari', 'Iberia', 'Tahuamanu']
  },
  'Moquegua': {
    'Mariscal Nieto': ['Moquegua', 'Carumas', 'Cuchumbaya', 'Samegua', 'San Cristóbal', 'Torata'],
    'General Sánchez Cerro': ['Omate', 'Chojata', 'Coalaque', 'Ichuña', 'La Capilla', 'Lloque', 'Matalaque', 'Puquina', 'Quinistaquillas', 'Ubinas', 'Yunga'],
    'Ilo': ['Ilo', 'El Algarrobal', 'Pacocha']
  },
  'Pasco': {
    'Pasco': ['Chaupimarca', 'Huachon', 'Huariaca', 'Huayllay', 'Ninacaca', 'Pallanchacra', 'San Francisco de Asís de Yarusyacán', 'Simón Bolívar', 'Ticlacayán', 'Tinyahuarco', 'Vicco', 'Yanacancha'],
    'Daniel Alcides Carrión': ['Yanahuanca', 'Chacayan', 'Goyllarisquizga', 'Paucar', 'San Pedro de Pillao', 'Santa Ana de Tusi', 'Tapuc', 'Vilcabamba'],
    'Oxapampa': ['Oxapampa', 'Chontabamba', 'Huancabamba', 'Palcazu', 'Pozuzo', 'Puerto Bermúdez', 'Villa Rica']
  },
  'Piura': {
    'Piura': ['Piura', 'Castilla', 'Catacaos', 'Cura Mori', 'El Tallan', 'La Arena', 'La Unión', 'Las Lomas', 'Tambo Grande'],
    'Ayabaca': ['Ayabaca', 'Frías', 'Jilili', 'Lagunas', 'Montero', 'Pacaipampa', 'Paimas', 'Sapillica', 'Sicchez', 'Suyo'],
    'Paita': ['Paita', 'Amotape', 'Colán', 'La Huaca', 'Tamri'],
    'Sullana': ['Sullana', 'Bellavista', 'Ignacio Escudero', 'Lancones', 'Marcavelica', 'Miguel Checa', 'Querecotillo', 'Salitral'],
    'Talara': ['Talara', 'El Alto', 'La Brea', 'Lobitos', 'Los Organos', 'Máncora', 'Pariñas']
  },
  'Puno': {
    'Puno': ['Puno', 'Acora', 'Amantani', 'Atuncolla', 'Capachica', 'Chucuito', 'Coata', 'Huata', 'Mañazo', 'Paucarcolla', 'Pichacani', 'Platería', 'San Antonio', 'Tiquillaca', 'Vilque'],
    'San Román': ['Juliaca', 'Cabana', 'Cabanillas', 'Caracoto', 'San Miguel'],
    'Chucuito': ['Juli', 'Desaguadero', 'Huacullani', 'Kelluyo', 'Pisacoma', 'Pomata', 'Zepita'],
    'Melgar': ['Ayaviri', 'Antauta', 'Cupi', 'Llalli', 'Macari', 'Nuñoa', 'Orurillo', 'Santa Rosa', 'Umachiri'],
    'Sandia': ['Sandia', 'Alto Inambari', 'Cuyocuyo', 'Limbani', 'Patambuco', 'Phara', 'Quiaca', 'San Juan del Oro', 'Yanahuaya']
  },
  'San Martín': {
    'Moyobamba': ['Moyobamba', 'Calzada', 'Habana', 'Jepelacio', 'Soritor', 'Yantalo'],
    'Bellavista': ['Bellavista', 'Alto Biavo', 'Bajo Biavo', 'Huallaga', 'San Pablo', 'San Rafael'],
    'Lamas': ['Lamas', 'Alonso de Alvarado', 'Barranquita', 'Caynarachi', 'Cuñumbuqui', 'Pinto Recodo', 'Rumisapa', 'San Roque de Cumbaza', 'Shanao', 'Tabalosos', 'Zapatero'],
    'Rioja': ['Rioja', 'Awajun', 'Elías Soplin Vargas', 'Nueva Cajamarca', 'Pardo Miguel', 'Posic', 'San Fernando', 'Yorongos', 'Yuracyacu'],
    'San Martín': ['Tarapoto', 'Alberto Leveau', 'Cacatachi', 'Chazuta', 'Chipurana', 'El Porvenir', 'Huimbayoc', 'Juan Guerra', 'La Banda de Shilcayo', 'Morales', 'Papaplaya', 'San Antonio', 'Sauce', 'Shapaja']
  },
  'Tacna': {
    'Tacna': ['Tacna', 'Alto de la Alianza', 'Calana', 'Ciudad Nueva', 'Coronel Gregorio Albarracín Lanchipa', 'Inclan', 'Pachia', 'Palca', 'Pocollay', 'Sama', 'La Yarada los Palos'],
    'Candarave': ['Candarave', 'Cairani', 'Camilaca', 'Curibaya', 'Huanuara', 'Quilahuani'],
    'Jorge Basadre': ['Locumba', 'Ilabaya', 'Ite'],
    'Tarata': ['Tarata', 'Chucatamani', 'Estique', 'Estique-Pampa', 'Sitajara', 'Susapaya', 'Tarucachi', 'Ticaco']
  },
  'Tumbes': {
    'Tumbes': ['Tumbes', 'Corrales', 'La Cruz', 'Pampas de Hospital', 'San Jacinto', 'San Juan de la Virgen'],
    'Contralmirante Villar': ['Zorritos', 'Casitas', 'Canoas de Punta Sal'],
    'Zarumilla': ['Zarumilla', 'Aguas Verdes', 'Matapalo', 'Papayal']
  },
  'Ucayali': {
    'Coronel Portillo': ['Calleria', 'Campoverde', 'Iparia', 'Masisea', 'Nueva Requena', 'Manantay', 'Yarinacocha'],
    'Atalaya': ['Raymondi', 'Bajo Urubamba', 'Sepahua', 'Tahuania', 'Yurua'],
    'Padre Abad': ['Aguaytia', 'Curimana', 'Irazola', 'Neshuya', 'Padre Abad']
  }
};

// ---------------------------------------------------------------------------
// BLOQUE B: Funciones puras para consultar el dataset
// ---------------------------------------------------------------------------

/**
 * Devuelve la lista ordenada de departamentos disponibles en el dataset.
 */
function obtenerDepartamentos() {
  const listaDepartamentos = Object.keys(DATOS_UBIGEO_PERU);
  listaDepartamentos.sort();
  return listaDepartamentos;
}

/**
 * Devuelve las provincias del departamento seleccionado.
 */
function obtenerProvincias(nombreDepartamento) {
  const provinciasDelDepartamento = DATOS_UBIGEO_PERU[nombreDepartamento];

  if (!provinciasDelDepartamento) {
    return [];
  }

  const listaProvincias = Object.keys(provinciasDelDepartamento);
  listaProvincias.sort();
  return listaProvincias;
}

/**
 * Devuelve los distritos de la provincia seleccionada dentro de un departamento.
 */
function obtenerDistritos(nombreDepartamento, nombreProvincia) {
  const provinciasDelDepartamento = DATOS_UBIGEO_PERU[nombreDepartamento];

  if (!provinciasDelDepartamento) {
    return [];
  }

  const distritosDeLaProvincia = provinciasDelDepartamento[nombreProvincia];

  if (!distritosDeLaProvincia) {
    return [];
  }

  const listaDistritos = distritosDeLaProvincia.slice();
  listaDistritos.sort();
  return listaDistritos;
}

// ---------------------------------------------------------------------------
// BLOQUE C: Helper DOM para llenar un selector HTML
// ---------------------------------------------------------------------------

/**
 * Limpia un select y lo llena con nuevas opciones de texto.
 */
function poblarSelect(idSelect, listaOpciones, textoPlaceholder) {
  const elementoSelect = document.getElementById(idSelect);

  if (!elementoSelect) {
    return;
  }

  // Limpiar opciones anteriores
  elementoSelect.innerHTML = '';

  // Crear la opción inicial de guía
  const opcionInicial = document.createElement('option');
  opcionInicial.value = '';
  opcionInicial.textContent = textoPlaceholder;
  opcionInicial.disabled = true;
  opcionInicial.selected = true;
  elementoSelect.appendChild(opcionInicial);

  // Agregar cada opción disponible
  for (let indice = 0; indice < listaOpciones.length; indice++) {
    const nombreOpcion = listaOpciones[indice];
    const nuevaOpcion = document.createElement('option');
    nuevaOpcion.value = nombreOpcion;
    nuevaOpcion.textContent = nombreOpcion;
    elementoSelect.appendChild(nuevaOpcion);
  }
}

/**
 * Reinicia un selector dejando solo su placeholder y deshabilitándolo.
 */
function reiniciarSelect(idSelect, textoPlaceholder) {
  const elementoSelect = document.getElementById(idSelect);

  if (!elementoSelect) {
    return;
  }

  elementoSelect.innerHTML = '';
  elementoSelect.disabled = true;

  const opcionInicial = document.createElement('option');
  opcionInicial.value = '';
  opcionInicial.textContent = textoPlaceholder;
  opcionInicial.disabled = true;
  opcionInicial.selected = true;
  elementoSelect.appendChild(opcionInicial);
}

// ---------------------------------------------------------------------------
// BLOQUE D: Lógica de cascada entre departamento, provincia y distrito
// ---------------------------------------------------------------------------

/**
 * Se ejecuta cuando el usuario cambia el departamento seleccionado.
 */
function manejarCambioDepartamento() {
  const selectDepartamento = document.getElementById('departamento');
  const departamentoElegido = selectDepartamento.value;

  if (departamentoElegido === '') {
    reiniciarSelect('provincia', 'Selecciona Provincia');
    reiniciarSelect('distrito', 'Selecciona Distrito');
    return;
  }

  const listaProvincias = obtenerProvincias(departamentoElegido);
  poblarSelect('provincia', listaProvincias, 'Selecciona Provincia');

  const selectProvincia = document.getElementById('provincia');
  selectProvincia.disabled = false;

  reiniciarSelect('distrito', 'Selecciona Distrito');
}

/**
 * Se ejecuta cuando el usuario cambia la provincia seleccionada.
 */
function manejarCambioProvincia() {
  const selectDepartamento = document.getElementById('departamento');
  const selectProvincia = document.getElementById('provincia');

  const departamentoElegido = selectDepartamento.value;
  const provinciaElegida = selectProvincia.value;

  if (provinciaElegida === '') {
    reiniciarSelect('distrito', 'Selecciona Distrito');
    return;
  }

  const listaDistritos = obtenerDistritos(departamentoElegido, provinciaElegida);
  poblarSelect('distrito', listaDistritos, 'Selecciona Distrito');

  const selectDistrito = document.getElementById('distrito');
  selectDistrito.disabled = false;
}

/**
 * Busca los selectores en la página y activa la cascada de ubigeo.
 */
function inicializarSelectoresUbigeo() {
  const selectDepartamento = document.getElementById('departamento');
  const selectProvincia = document.getElementById('provincia');
  const selectDistrito = document.getElementById('distrito');

  // Si la página no tiene los tres selectores, no hacemos nada
  if (!selectDepartamento || !selectProvincia || !selectDistrito) {
    return;
  }

  // Cargar departamentos al iniciar
  const listaDepartamentos = obtenerDepartamentos();
  poblarSelect('departamento', listaDepartamentos, 'Selecciona Departamento');

  // Dejar provincia y distrito listos pero deshabilitados
  reiniciarSelect('provincia', 'Selecciona Provincia');
  reiniciarSelect('distrito', 'Selecciona Distrito');

  // Escuchar cambios del usuario
  selectDepartamento.addEventListener('change', manejarCambioDepartamento);
  selectProvincia.addEventListener('change', manejarCambioProvincia);
}

// ---------------------------------------------------------------------------
// BLOQUE E: Catálogo estático de oficios disponibles en la plataforma
// ---------------------------------------------------------------------------
const OFICIOS_DISPONIBLES = [
  'Electricista',
  'Gasfitero',
  'Carpintero',
  'Pintor',
  'Técnico de Línea Blanca',
  'Cerrajero',
  'Albañil',
  'Técnico de PCs'
];

/**
 * Puebla los selectores de oficio (#input-oficio, #ofrecer-oficio) con opciones predefinidas.
 */
function inicializarSelectoresOficio() {
  const selectHero = document.getElementById('input-oficio');
  const selectOfrecer = document.getElementById('ofrecer-oficio');

  if (selectHero) {
    poblarSelect('input-oficio', OFICIOS_DISPONIBLES, 'Selecciona el Oficio');
  }

  if (selectOfrecer) {
    poblarSelect('ofrecer-oficio', OFICIOS_DISPONIBLES, 'Selecciona tu Oficio');
  }
}

// ---------------------------------------------------------------------------
// BLOQUE F: Arranque automático cuando el DOM está listo
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  inicializarSelectoresUbigeo();
  inicializarSelectoresOficio();
});
