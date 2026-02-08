import type { Universe, UniverseSelectorProps } from '../types';
import './UniverseSelector.css';

// 15 universos populares que atraem crianças e adultos
// Categorias e seus Universos (70 no total)
export const UNIVERSES: Universe[] = [
    // 🏰 Animação Global & Estúdios
    { id: 'mickey', name: 'Mickey & Amigos', emoji: '🐭', category: 'Animação Global & Estúdios', description: 'O clássico absoluto', style: 'Mickey Mouse universe, classic Disney animation, playful and magical', color: 'hsl(0, 80%, 50%)' },
    { id: 'princesses', name: 'Princesas Disney', emoji: '👑', category: 'Animação Global & Estúdios', description: 'Cinderela, Ariel, Rapunzel...', style: 'Disney Princess universe, fairytale aesthetic, magical enchanted castles', color: 'hsl(320, 70%, 65%)' },
    { id: 'frozen', name: 'Frozen', emoji: '❄️', category: 'Animação Global & Estúdios', description: 'Reino de Arendelle', style: 'Frozen universe, Arendelle, ice magic, cinematic Disney style', color: 'hsl(190, 80%, 70%)' },
    { id: 'lion-king', name: 'Rei Leão', emoji: '🦁', category: 'Animação Global & Estúdios', description: 'Savana Africana', style: 'The Lion King universe, African Savanna, Pride Rock, vibrant nature', color: 'hsl(35, 80%, 50%)' },
    { id: 'toy-story', name: 'Toy Story', emoji: '🤠', category: 'Animação Global & Estúdios', description: 'Mundo dos Brinquedos', style: 'Toy Story universe, living toys, Pixar 3D style, colorful and detailed', color: 'hsl(210, 80%, 55%)' },
    { id: 'inside-out', name: 'Divertida Mente', emoji: '🧠', category: 'Animação Global & Estúdios', description: 'Mundo das Emoções', style: 'Inside Out universe, Headquarters, colorful emotion-based worlds', color: 'hsl(280, 70%, 60%)' },
    { id: 'incredibles', name: 'Os Incríveis', emoji: '💥', category: 'Animação Global & Estúdios', description: 'Família de Heróis', style: 'The Incredibles universe, retro-futuristic hero aesthetic, Pixar style', color: 'hsl(10, 90%, 55%)' },
    { id: 'moana', name: 'Moana', emoji: '🌀', category: 'Animação Global & Estúdios', description: 'Aventuras no Oceano', style: 'Moana universe, Motunui island, Polynesian aesthetic, glowing ocean', color: 'hsl(170, 70%, 45%)' },
    { id: 'aladdin', name: 'Aladdin', emoji: '🧞', category: 'Animação Global & Estúdios', description: 'Mil e Uma Noites', style: 'Aladdin universe, Agrabah, Arabian nights, desert city, magic', color: 'hsl(45, 90%, 55%)' },
    { id: 'zootopia', name: 'Zootopia', emoji: '🦊', category: 'Animação Global & Estúdios', description: 'Cidade Animal', style: 'Zootopia universe, anthropomorphic city, modern animal world', color: 'hsl(140, 60%, 50%)' },
    { id: 'minions', name: 'Minions', emoji: '🍌', category: 'Animação Global & Estúdios', description: 'Meu Malvado Favorito', style: 'Despicable Me universe, Minions, gadget-filled labs, colorful illumination style', color: 'hsl(50, 95%, 55%)' },
    { id: 'shrek', name: 'Shrek', emoji: '🧅', category: 'Animação Global & Estúdios', description: 'O Pântano e Tão Tão Distante', style: 'Shrek universe, fairytale swamp, Duloc, Dreamworks 3D animation style', color: 'hsl(80, 70%, 45%)' },

    // ⛩️ Cultura Otaku (Animes & Mangás)
    { id: 'dragon-ball', name: 'Dragon Ball', emoji: '🐉', category: 'Cultura Otaku (Animes & Mangás)', description: 'Guerreiros Z', style: 'Dragon Ball Z universe, Akira Toriyama art style, powerful energy auras (KI)', color: 'hsl(25, 100%, 55%)' },
    { id: 'one-piece', name: 'One Piece', emoji: '🏴‍☠️', category: 'Cultura Otaku (Animes & Mangás)', description: 'Piratas e Tesouro', style: 'One Piece universe, Grand Line, seafaring adventure, anime style', color: 'hsl(340, 80%, 50%)' },
    { id: 'naruto', name: 'Naruto', emoji: '🍥', category: 'Cultura Otaku (Animes & Mangás)', description: 'Mundo Ninja', style: 'Naruto universe, Konoha village, ninja action, anime style', color: 'hsl(25, 100%, 50%)' },
    { id: 'pokemon', name: 'Pokémon', emoji: '⚡', category: 'Cultura Otaku (Animes & Mangás)', description: 'Mestres e Treinadores', style: 'Pokemon world, anime style, colorful creatures, vibrant battles', color: 'hsl(50, 95%, 50%)' },
    { id: 'knights-zodiac', name: 'Cavaleiros do Zodíaco', emoji: '🌌', category: 'Cultura Otaku (Animes & Mangás)', description: 'Santuário e Armaduras', style: 'Saint Seiya universe, golden armors, cosmic energy (Cosmos), epic anime', color: 'hsl(45, 80%, 50%)' },
    { id: 'demon-slayer', name: 'Demon Slayer', emoji: '⚔️', category: 'Cultura Otaku (Animes & Mangás)', description: 'Caçadores de Demônios', style: 'Demon Slayer style, traditional Japanese aesthetic, elemental breathing effects', color: 'hsl(180, 70%, 45%)' },
    { id: 'attack-titan', name: 'Attack on Titan', emoji: '🧱', category: 'Cultura Otaku (Animes & Mangás)', description: 'Muralhas e Titãs', style: 'Attack on Titan universe, gritty anime style, giant walls, titans', color: 'hsl(20, 40%, 30%)' },
    { id: 'sailor-moon', name: 'Sailor Moon', emoji: '🌙', category: 'Cultura Otaku (Animes & Mangás)', description: 'Guerreiras Mágicas', style: 'Sailor Moon universe, 90s anime aesthetic, pastel sparkling effects', color: 'hsl(300, 70%, 65%)' },
    { id: 'ghibli', name: 'Studio Ghibli', emoji: '🌿', category: 'Cultura Otaku (Animes & Mangás)', description: 'Chihiro/Totoro', style: 'Studio Ghibli aesthetic, hand-painted background, nature-heavy', color: 'hsl(145, 50%, 45%)' },
    { id: 'yugioh', name: 'Yu-Gi-Oh!', emoji: '🃏', category: 'Cultura Otaku (Animes & Mangás)', description: 'Duelos de Monstros', style: 'Yu-Gi-Oh universe, card hologram duels, anime style', color: 'hsl(240, 60%, 45%)' },

    // 🎮 Mundo dos Games
    { id: 'mario', name: 'Super Mario Bros', emoji: '🍄', category: 'Mundo dos Games', description: 'Reino do Cogumelo', style: 'Super Mario universe, Mushroom Kingdom, Nintendo aesthetic', color: 'hsl(0, 80%, 55%)' },
    { id: 'sonic', name: 'Sonic', emoji: '🦔', category: 'Mundo dos Games', description: 'Velocidade Supersônica', style: 'Sonic universe, Green Hill Zone, rings, blue streaks, high-speed action', color: 'hsl(220, 90%, 50%)' },
    { id: 'minecraft', name: 'Minecraft', emoji: '⛏️', category: 'Mundo dos Games', description: 'Mundo de Blocos', style: 'Minecraft universe, blocky voxel world, survival adventure', color: 'hsl(120, 50%, 40%)' },
    { id: 'gta', name: 'GTA', emoji: '🚗', category: 'Mundo dos Games', description: 'Crimes e Cidade Grande', style: 'Grand Theft Auto style, modern urban sprawl, realistic lighting', color: 'hsl(200, 10%, 40%)' },
    { id: 'lol', name: 'League of Legends', emoji: '🏆', category: 'Mundo dos Games', description: 'Runeterra', style: 'League of Legends universe, Runeterra, magical high fantasy, Arcane style', color: 'hsl(200, 80%, 40%)' },
    { id: 'zelda', name: 'The Legend of Zelda', emoji: '🗡️', category: 'Mundo dos Games', description: 'Reino de Hyrule', style: 'The Legend of Zelda, Breath of the Wild style, painterly landscapes', color: 'hsl(80, 60%, 45%)' },
    { id: 'god-of-war', name: 'God of War', emoji: '🪓', category: 'Mundo dos Games', description: 'Mitologia e Guerra', style: 'God of War universe, Norse mythology, epic scale, detailed textures', color: 'hsl(0, 30%, 40%)' },
    { id: 'street-fighter', name: 'Street Fighter', emoji: '🥋', category: 'Mundo dos Games', description: 'Torneio de Lutas', style: 'Street Fighter V style, ink splash effects, martial arts focus', color: 'hsl(350, 80%, 45%)' },
    { id: 'mortal-kombat', name: 'Mortal Kombat', emoji: '🐲', category: 'Mundo dos Games', description: 'Fatalities e Portais', style: 'Mortal Kombat universe, dark and gritty martial arts, fatalities, mystic realms (Outworld)', color: 'hsl(0, 50%, 30%)' },
    { id: 'fortnite', name: 'Fortnite', emoji: '🚌', category: 'Mundo dos Games', description: 'Battle Royale', style: 'Fortnite aesthetic, vibrant 3D cartoon style, battle royale chaos', color: 'hsl(270, 80%, 60%)' },
    { id: 'resident-evil', name: 'Resident Evil', emoji: '🧟', category: 'Mundo dos Games', description: 'Sobrevivência e Zumbis', style: 'Resident Evil universe, survival horror, claustrophobic lighting, zombies', color: 'hsl(0, 60%, 20%)' },

    // ⚡ HQs, Heróis & Vilões
    { id: 'marvel', name: 'Universo Marvel', emoji: '🦸', category: 'HQs, Heróis & Vilões', description: 'Vingadores', style: 'Marvel Cinematic Universe (MCU), epic superhero action, high-tech suits', color: 'hsl(0, 80%, 50%)' },
    { id: 'dc', name: 'Universo DC', emoji: '🦇', category: 'HQs, Heróis & Vilões', description: 'Batman, Superman & Liga', style: 'DC Universe, Gotham and Metropolis, dark and epic superhero aesthetic', color: 'hsl(220, 90%, 30%)' },
    { id: 'monica', name: 'Turma da Mônica', emoji: '🐰', category: 'HQs, Heróis & Vilões', description: 'Bairro do Limoeiro', style: 'Monica s Gang universe, Mauricio de Sousa art style, colorful comic book look, Limoeiro neighborhood', color: 'hsl(0, 90%, 60%)' },
    { id: 'transformers', name: 'Transformers', emoji: '🤖', category: 'HQs, Heróis & Vilões', description: 'Robôs Gigantes', style: 'Transformers universe, massive mechanical robots, urban action, cinematic debris', color: 'hsl(210, 80%, 45%)' },
    { id: 'walking-dead', name: 'The Walking Dead', emoji: '🧟', category: 'HQs, Heróis & Vilões', description: 'Apocalipse Zumbi', style: 'The Walking Dead universe, zombie apocalypse, gritty survival, dark cinematic tone', color: 'hsl(60, 20%, 30%)' },

    // 🧙‍♂️ Fantasia, Magia & Aventura
    { id: 'harry-potter', name: 'Harry Potter', emoji: '🧙', category: 'Fantasia, Magia & Aventura', description: 'Mundo Bruxo', style: 'Harry Potter universe, Hogwarts castle, magical spells, wizarding world', color: 'hsl(45, 70%, 40%)' },
    { id: 'lotr', name: 'Senhor dos Anéis', emoji: '💍', category: 'Fantasia, Magia & Aventura', description: 'Terra Média', style: 'Lord of the Rings universe, Middle-earth, epic fantasy, natural landscapes', color: 'hsl(35, 60%, 40%)' },
    { id: 'game-of-thrones', name: 'Game of Thrones', emoji: '⚔️', category: 'Fantasia, Magia & Aventura', description: 'Westeros', style: 'Game of Thrones universe, Westeros, dark medieval fantasy, dragons', color: 'hsl(210, 20%, 30%)' },
    { id: 'pirates', name: 'Piratas do Caribe', emoji: '🏴‍☠️', category: 'Fantasia, Magia & Aventura', description: 'Mistérios do Mar', style: 'Pirates of the Caribbean style, Caribbean sea, supernatural pirate mythos, Jack Sparrow vibe', color: 'hsl(190, 40%, 30%)' },
    { id: 'indiana-jones', name: 'Indiana Jones', emoji: '🤠', category: 'Fantasia, Magia & Aventura', description: 'Arqueologia e Aventura', style: 'Indiana Jones style, 1940s adventure, ancient temples, classic cinematic expedition', color: 'hsl(30, 50%, 40%)' },
    { id: 'avatar', name: 'Avatar', emoji: '🌌', category: 'Fantasia, Magia & Aventura', description: 'Pandora', style: 'Avatar Pandora universe, bioluminescent forests, floating mountains, Navi culture, blue glow', color: 'hsl(190, 90%, 45%)' },
    { id: 'barbie', name: 'Barbie', emoji: '🎀', category: 'Fantasia, Magia & Aventura', description: 'Barbieland', style: 'Barbieland aesthetic, all-pink world, highly stylized toy-inspired cinematography', color: 'hsl(330, 100%, 70%)' },
    { id: 'lego', name: 'LEGO', emoji: '🧱', category: 'Fantasia, Magia & Aventura', description: 'Mundo da Construção', style: 'LEGO universe, world built from plastic bricks, stop-motion animation aesthetic', color: 'hsl(50, 100%, 50%)' },

    // 🚀 Sci-Fi, Sobrenatural & Mistério
    { id: 'star-wars', name: 'Star Wars', emoji: '🚀', category: 'Sci-Fi, Sobrenatural & Mistério', description: 'Jedi e Império', style: 'Star Wars universe, lightsabers, X-Wings, sci-fi cinematic style', color: 'hsl(200, 100%, 50%)' },
    { id: 'star-trek', name: 'Star Trek', emoji: '🖖', category: 'Sci-Fi, Sobrenatural & Mistério', description: 'Frota Estelar', style: 'Star Trek universe, Enterprise spaceship, high-tech uniforms, galactic diplomacy, futuristic sci-fi', color: 'hsl(220, 80%, 45%)' },
    { id: 'matrix', name: 'Matrix', emoji: '🕶️', category: 'Sci-Fi, Sobrenatural & Mistério', description: 'Simulação Digital', style: 'The Matrix aesthetic, green digital code rainfall, raining noir, high-speed bullet time action', color: 'hsl(145, 100%, 40%)' },
    { id: 'jurassic-park', name: 'Jurassic Park', emoji: '🦖', category: 'Sci-Fi, Sobrenatural & Mistério', description: 'Ilha dos Dinossauros', style: 'Jurassic Park universe, giant dinosaurs, tropical island, cinematic suspense', color: 'hsl(120, 60%, 25%)' },
    { id: 'back-to-future', name: 'De Volta para o Futuro', emoji: '🏎️', category: 'Sci-Fi, Sobrenatural & Mistério', description: 'Viagem no Tempo', style: 'Back to the Future style, 1985 and 1955 aesthetics, DeLorean time machine, retro-futurism', color: 'hsl(30, 90%, 55%)' },
    { id: 'stranger-things', name: 'Stranger Things', emoji: '🚲', category: 'Sci-Fi, Sobrenatural & Mistério', description: 'Anos 80 e Mundo Invertido', style: 'Stranger Things universe, 80s Hawkins, Upside Down, neon lights, synthwave vibes', color: 'hsl(350, 80%, 40%)' },
    { id: 'mib', name: 'MIB: Homens de Preto', emoji: '🕴️', category: 'Sci-Fi, Sobrenatural & Mistério', description: 'Agência Anti-Alienígena', style: 'Men in Black aesthetic, sleek suits, futuristic chrome gadgets, quirky aliens, urban sci-fi', color: 'hsl(200, 10%, 20%)' },
    { id: 'ghostbusters', name: 'Os Caça-Fantasmas', emoji: '🚫', category: 'Sci-Fi, Sobrenatural & Mistério', description: 'Atrapar Fantasmas', style: 'Ghostbusters aesthetic, ECTO-1, proton packs, glowing ghosts, 80s paranormal comedy vibes', color: 'hsl(0, 80%, 50%)' },
    { id: 'addams-family', name: 'A Família Addams', emoji: '🥀', category: 'Sci-Fi, Sobrenatural & Mistério', description: 'Umbral e Gótico', style: 'Addams Family aesthetic, macabre gothic mansion, dark comedy, monochromatic mood with pops of deep color', color: 'hsl(260, 20%, 20%)' },

    // 📺 TV, Humor & Nostalgia
    { id: 'chaves', name: 'Chaves', emoji: '🥖', category: 'TV, Humor & Nostalgia', description: 'A Vila', style: 'El Chavo del Ocho universe, the neighborhood (La Vecindad), rustic and cozy sitcom aesthetic', color: 'hsl(35, 60%, 50%)' },
    { id: 'chapolin', name: 'Chapolin Colorado', emoji: '🦗', category: 'TV, Humor & Nostalgia', description: 'Herói Atrapalhado', style: 'El Chapulin Colorado aesthetic, red suit with yellow heart, comical hero adventures, Latin American sitcom style', color: 'hsl(0, 90%, 50%)' },
    { id: 'simpsons', name: 'Os Simpsons', emoji: '🍩', category: 'TV, Humor & Nostalgia', description: 'Springfield', style: 'The Simpsons universe, Matt Groening art style, yellow characters, Springfield town, 2D animation', color: 'hsl(50, 100%, 50%)' },
    { id: 'spongebob', name: 'Bob Esponja', emoji: '🧽', category: 'TV, Humor & Nostalgia', description: 'Fenda do Biquíni', style: 'Spongebob universe, underwater bikini bottom, colorful and wacky cartoon style', color: 'hsl(55, 95%, 60%)' },
    { id: 'scoobydoo', name: 'Scooby-Doo', emoji: '🐕', category: 'TV, Humor & Nostalgia', description: 'Mistérios e Fantasmas', style: 'Scooby-Doo classic animation style, Mystery Machine, spooky haunted locations, teen detective vibes', color: 'hsl(140, 60%, 40%)' },

    // 💼 Roleplay: Vida Real & Profissões
    { id: 'spy', name: 'Agente Secreto / 007', emoji: '🕶️', category: 'Roleplay: Vida Real & Profissões', description: 'Espionagem', style: 'James Bond 007 style, luxury life, high-stakes espionage, classy cinematic', color: 'hsl(240, 10%, 20%)' },
    { id: 'president', name: 'O Presidente', emoji: '🏛️', category: 'Roleplay: Vida Real & Profissões', description: 'Política e Crise Global', style: 'The White House, Oval Office, intense political thriller, high-stakes drama', color: 'hsl(220, 80%, 40%)' },
    { id: 'detective', name: 'Sherlock Holmes', emoji: '🔍', category: 'Roleplay: Vida Real & Profissões', description: 'Investigação Detetivesca', style: 'Sherlock Holmes aesthetic, Victorian London mystery, moody atmospheric lighting', color: 'hsl(30, 40%, 30%)' },
    { id: 'swat', name: 'Comando Tático / SWAT', emoji: '🛡️', category: 'Roleplay: Vida Real & Profissões', description: 'Operações Especiais', style: 'SWAT tactical unit, urban rescue missions, realistic military tactical gear', color: 'hsl(150, 10%, 25%)' },
    { id: 'heist', name: 'O Assalto', emoji: '👺', category: 'Roleplay: Vida Real & Profissões', description: 'Planejamento de Roubo', style: 'Money Heist aesthetic, bank heist thriller, red jumpsuits, high-tension crime', color: 'hsl(0, 80%, 40%)' },
    { id: 'treasure-hunter', name: 'Caçador de Tesouros', emoji: '🗺️', category: 'Roleplay: Vida Real & Profissões', description: 'Exploração Arqueológica', style: 'Uncharted/Indiana Jones aesthetic, hidden ruins, jungle discovery, adventure cinematic', color: 'hsl(40, 60%, 45%)' },
    { id: 'castaway', name: 'O Náufrago', emoji: '🏝️', category: 'Roleplay: Vida Real & Profissões', description: 'Sobrevivência Extrema', style: 'Castaway aesthetic, deserted tropical island, raw survival struggle, cinematic nature', color: 'hsl(180, 50%, 45%)' },
    { id: 'tech-tycoon', name: 'Magnata da Tecnologia', emoji: '💻', category: 'Roleplay: Vida Real & Profissões', description: 'Negócios e Inovação', style: 'Silicon Valley tech empire, futuristic office, innovation and power vibes', color: 'hsl(200, 90%, 50%)' },
    { id: 'top-gun', name: 'Piloto de Caça', emoji: '✈️', category: 'Roleplay: Vida Real & Profissões', description: 'Combate Aéreo', style: 'Top Gun Maverick aesthetic, fighter jets, high G-force aerial combat, sky cinematography', color: 'hsl(210, 60%, 50%)' },
    { id: 'doctor', name: 'Médico de Emergência', emoji: '🏥', category: 'Roleplay: Vida Real & Profissões', description: 'Hospital e Trauma', style: 'ER medical drama, lifesaving urgency, intense hospital environment cinematic', color: 'hsl(0, 70%, 60%)' },
];

export default function UniverseSelector({ selected, onSelect }: UniverseSelectorProps) {
    const handleKeyDown = (e: React.KeyboardEvent, universeId: string): void => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(universeId);
            // Scroll suave para o elemento selecionado após um pequeno delay para a transição
            setTimeout(() => {
                const element = document.getElementById(`universe-${universeId}`);
                element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    };

    // Agrupar universos por categoria
    const categories = Array.from(new Set(UNIVERSES.map(u => u.category || 'Outros')));

    return (
        <div className="universe-selector">
            <div className="universe-header">
                <span className="universe-emoji" aria-hidden="true">🌌</span>
                <h3 id="universe-heading">Escolha o Universo</h3>
                <p>Em qual mundo sua história vai acontecer?</p>
            </div>

            <div className="universe-categories">
                {categories.map(category => (
                    <section key={category} className="universe-category-group">
                        <h4 className="category-title">{category}</h4>
                        <div
                            className="universe-grid"
                            role="radiogroup"
                            aria-label={`Universos de ${category}`}
                        >
                            {UNIVERSES.filter(u => u.category === category).map((universe) => (
                                <div
                                    key={universe.id}
                                    id={`universe-${universe.id}`}
                                    className={`universe-item ${selected === universe.id ? 'selected' : ''}`}
                                    onClick={() => onSelect(universe.id)}
                                    onKeyDown={(e) => handleKeyDown(e, universe.id)}
                                    style={{ '--universe-color': universe.color } as React.CSSProperties}
                                    role="radio"
                                    aria-checked={selected === universe.id}
                                    tabIndex={0}
                                    aria-label={`${universe.name}: ${universe.description}`}
                                >
                                    <span className="universe-item-emoji" aria-hidden="true">
                                        {universe.emoji}
                                    </span>
                                    <div className="universe-item-info">
                                        <h5>{universe.name}</h5>
                                        <p>{universe.description}</p>
                                    </div>
                                    {selected === universe.id && (
                                        <span className="universe-check" aria-hidden="true">✓</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}

