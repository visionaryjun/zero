document.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('appear');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const fadeItems = document.querySelectorAll('.fade-in');
    fadeItems.forEach(item => {
        observer.observe(item);
    });

    // Sovereign Rollup Visualization
    const canvas = document.getElementById('hero-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        const execCount = 40;
        const daCount = 30;
        const connectionDistance = 150;
        let mouse = { x: null, y: null };
        let activeRollups = [];

        class RollupLine {
            constructor(x, y, targetY) {
                this.x = x;
                this.y = y;
                this.targetY = targetY;
                this.life = 1.0;
                this.decay = 0.012; // Slightly slower decay
            }

            draw() {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(129, 140, 248, ${this.life * 0.7})`;
                ctx.lineWidth = 1;
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x, this.targetY);
                ctx.stroke();
                this.life -= this.decay;
            }
        }

        class Particle {
            constructor(type) {
                this.type = type;
                this.reset();
            }

            reset() {
                const dpr = window.devicePixelRatio || 1;
                const width = (canvas.width / dpr) || window.innerWidth;
                const height = (canvas.height / dpr) || window.innerHeight;

                if (this.type === 'exec') {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * 180;
                    this.x = (width / 2) + Math.cos(angle) * radius;
                    this.y = (height / 2) + Math.sin(angle) * radius;
                    this.vx = (Math.random() - 0.5) * 1.6;
                    this.vy = (Math.random() - 0.5) * 1.6;
                    this.baseSize = Math.random() * 3 + 3;
                } else {
                    this.x = Math.random() * width;
                    this.y = height - (Math.random() * 50 + 20);
                    this.vx = (Math.random() * 1.4) + 0.8;
                    this.vy = (Math.random() - 0.5) * 0.1;
                    this.baseSize = Math.random() * 1.5 + 1.2;
                }
                this.size = this.baseSize;
                this.pulseOffset = Math.random() * Math.PI * 2;
                this.pulseSpeed = 0.03 + Math.random() * 0.05;
                this.currentBrightness = 0.8;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                const dpr = window.devicePixelRatio || 1;
                const width = canvas.width / dpr;
                const height = canvas.height / dpr;

                if (this.type === 'exec') {
                    const centerX = width / 2;
                    const centerY = height / 2;
                    const dx = this.x - centerX;
                    const dy = this.y - centerY;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist > 280) {
                        this.vx -= dx * 0.0015;
                        this.vy -= dy * 0.0015;
                    }

                    if (mouse.x && mouse.y) {
                        const mdx = mouse.x - this.x;
                        const mdy = mouse.y - this.y;
                        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
                        if (mdist < 120) {
                            this.x -= mdx * 0.03;
                            this.y -= mdy * 0.03;
                        }
                    }
                } else {
                    if (this.x > width) this.x = -10;
                    if (this.x < -20) this.x = width;
                }

                // Individualized Pulse Logic
                this.pulseOffset += this.pulseSpeed;
                const pulseFactor = Math.sin(this.pulseOffset);
                this.size = this.baseSize + pulseFactor * (this.type === 'exec' ? 3.0 : 0.6);
                this.currentBrightness = 0.6 + (pulseFactor + 1) * 0.2; // 0.6 to 1.0 range
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);

                if (this.type === 'exec') {
                    ctx.fillStyle = `rgba(129, 140, 248, ${this.currentBrightness})`;
                    ctx.shadowBlur = 10 + (this.currentBrightness - 0.6) * 40;
                    ctx.shadowColor = 'rgba(129, 140, 248, 0.6)';
                } else {
                    ctx.fillStyle = `rgba(34, 211, 238, ${this.currentBrightness * 0.8})`;
                    ctx.shadowBlur = 4;
                    ctx.shadowColor = 'rgba(34, 211, 238, 0.4)';
                }

                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        function init() {
            const dpr = window.devicePixelRatio || 1;
            const parent = canvas.parentElement;
            if (!parent) return;

            canvas.width = parent.offsetWidth * dpr;
            canvas.height = parent.offsetHeight * dpr;

            // Reset transform before re-scaling to avoid cumulative scaling
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            particles = [];
            activeRollups = [];
            for (let i = 0; i < execCount; i++) particles.push(new Particle('exec'));
            for (let i = 0; i < daCount; i++) particles.push(new Particle('da'));
        }

        function animate() {
            const dpr = window.devicePixelRatio || 1;
            const width = canvas.width / dpr;
            const height = canvas.height / dpr;

            ctx.clearRect(0, 0, width, height);

            // Draw DA Layer base line
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.15)';
            ctx.lineWidth = 1;
            ctx.moveTo(0, height - 45);
            ctx.lineTo(width, height - 45);
            ctx.stroke();

            // Draw Rollup Lines
            for (let i = activeRollups.length - 1; i >= 0; i--) {
                activeRollups[i].draw();
                if (activeRollups[i].life <= 0) activeRollups.splice(i, 1);
            }

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();

                if (particles[i].type === 'exec') {
                    for (let j = i + 1; j < particles.length; j++) {
                        if (particles[j].type !== 'exec') continue;
                        const dx = particles[i].x - particles[j].x;
                        const dy = particles[i].y - particles[j].y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < connectionDistance) {
                            ctx.beginPath();
                            ctx.strokeStyle = `rgba(129, 140, 248, ${(1 - dist / connectionDistance) * 0.35})`;
                            ctx.lineWidth = 0.5;
                            ctx.moveTo(particles[i].x, particles[i].y);
                            ctx.lineTo(particles[j].x, particles[j].y);
                            ctx.stroke();
                        }
                    }

                    // Chance to trigger a Rollup line
                    if (Math.random() < 0.008) {
                        activeRollups.push(new RollupLine(particles[i].x, particles[i].y, height - 45));
                    }
                }
            }
            requestAnimationFrame(animate);
        }

        window.addEventListener('resize', init);

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });

        canvas.addEventListener('mouseleave', () => {
            mouse.x = null;
            mouse.y = null;
        });

        init();
        animate();
    }

    // Internationalization (i18n)
    const translations = {
        ko: {
            nav_features: "주요 기술",
            nav_architecture: "아키텍처",
            nav_roadmap: "로드맵",
            nav_get_started: "시작하기",
            hero_title: "Sovereign Anonymity with <span class=\"gradient-text\">Zero</span>",
            hero_subtitle: "기존의 경계를 넘어선 프라이버시. Cosmos SDK와 고성능 Rust 암호화 코어가 만나 탄생한 차세대 소버린 롤업 메신저.",
            hero_btn_whitepaper: "화이트페이퍼 읽기",
            hero_btn_github: "GitHub 탐색",
            features_title: "핵심 기술 (Core Tech)",
            features_subtitle: "내용, 수신자, 발신자, 검색의 4중 은닉을 통한 완벽한 익명성 보장",
            feature_dksap_title: "DKSAP (ECC)",
            feature_dksap_desc: "Dual-Key Stealth Address Protocol. 수신자의 고정 주소를 노출하지 않고 일회용 stealth address를 생성하여 익명성을 완벽히 보호합니다.",
            feature_omr_title: "OMR (FHE)",
            feature_omr_desc: "Oblivious Message Retrieval. 노드가 메시지 내용을 알지 못한 채 사용자의 메시지만 골라낼 수 있는 완전 동형 암호화(TFHE) 기반 검색 엔진.",
            feature_zk_title: "ZK-Proof Fee",
            feature_zk_desc: "사용자의 신원을 밝히지 않고도 수수료 지불 능력을 증명하는 Groth16 ZK-SNARK 기반의 혁신적인 경제 모델.",
            arch_title: "Modular Architecture",
            arch_subtitle: "Cosmos SDK 기반 실행 레이어와 Rust 기반 암호화 코어의 완벽한 상호작용",
            arch_exec_title: "Execution Layer (Cosmos SDK + Rollkit)",
            arch_exec_desc: "v1.3 아키텍처는 하드포크 없이 경제 모델을 도입할 수 있는 유연한 슬롯 구조를 제공합니다. Celestia를 DA 레이어로 사용하여 검열 저항성을 확보합니다.",
            arch_core_title: "Crypto Core (Rust Library)",
            arch_core_desc: "DKSAP, TFHE OMR, Groth16 ZK-Proof 등 고성능 연산이 필요한 핵심 암호화 로직을 Rust로 구현하여 극강의 성능을 보장합니다.",
            roadmap_title: "Roadmap",
            roadmap_p1_title: "Phase 1-2: Foundation",
            roadmap_p1_desc: "보안 강화, 안정화 및 Invite Code 시스템 구축 완료.",
            roadmap_p3_title: "Phase 3: Deep Tech",
            roadmap_p3_desc: "ZK-Proof Fee 프로덕션 보안 강화 및 클라이언트 측 실제 증명 연동 진행 중.",
            roadmap_p4_title: "Phase 4: Mainnet Launch",
            roadmap_p4_desc: "보상 분배 모델 완성 및 메인넷 정식 런칭.",
            footer_copy: "&copy; 2026 Just Labs Inc. All rights reserved."
        },
        en: {
            nav_features: "Features",
            nav_architecture: "Architecture",
            nav_roadmap: "Roadmap",
            nav_get_started: "Get Started",
            hero_title: "Sovereign Anonymity with <span class=\"gradient-text\">Zero</span>",
            hero_subtitle: "Privacy beyond boundaries. A next-gen sovereign rollup messenger combining Cosmos SDK with high-performance Rust cryptographic cores.",
            hero_btn_whitepaper: "Read Whitepaper",
            hero_btn_github: "Explore GitHub",
            features_title: "Core Technologies",
            features_subtitle: "Perfect anonymity through quadruple concealment: Content, Sender, Receiver, and Search.",
            feature_dksap_title: "DKSAP (ECC)",
            feature_dksap_desc: "Dual-Key Stealth Address Protocol. Protects receiver privacy by generating one-time stealth addresses instead of exposing fixed addresses.",
            feature_omr_title: "OMR (FHE)",
            feature_omr_desc: "Oblivious Message Retrieval. A TFHE-based search engine that retrieves messages for users without nodes ever knowing the content.",
            feature_zk_title: "ZK-Proof Fee",
            feature_zk_desc: "An innovative economic model using Groth16 ZK-SNARKs to prove fee solvency without revealing user identity.",
            arch_title: "Modular Architecture",
            arch_subtitle: "Seamless interaction between Cosmos SDK execution layers and Rust cryptographic cores.",
            arch_exec_title: "Execution Layer (Cosmos SDK + Rollkit)",
            arch_exec_desc: "v1.3 architecture provides flexible slot structures for economic model integration without hard forks, utilizing Celestia for DA.",
            arch_core_title: "Crypto Core (Rust Library)",
            arch_core_desc: "Ensures extreme performance by implementing DKSAP, TFHE OMR, and Groth16 ZK-Proofs in highly optimized Rust logic.",
            roadmap_title: "Roadmap",
            roadmap_p1_title: "Phase 1-2: Foundation",
            roadmap_p1_desc: "Security hardening, stabilization, and completion of the Invite Code system.",
            roadmap_p3_title: "Phase 3: Deep Tech",
            roadmap_p3_desc: "ZK-Proof Fee production security reinforcement and client-side proof integration currently in progress.",
            roadmap_p4_title: "Phase 4: Mainnet Launch",
            roadmap_p4_desc: "Completion of reward distribution models and official Mainnet launch.",
            footer_copy: "&copy; 2026 Just Labs Inc. All rights reserved."
        },
        ja: {
            nav_features: "主要技術",
            nav_architecture: "アーキテクチャ",
            nav_roadmap: "ロードマップ",
            nav_get_started: "スタートガイド",
            hero_title: "Sovereign Anonymity with <span class=\"gradient-text\">Zero</span>",
            hero_subtitle: "境界を超えたプライバシー。Cosmos SDKと高性能Rust暗号化コアが融合した、次世代ソブリン・ロールアップ・メッセンジャー。",
            hero_btn_whitepaper: "ホワイトペーパーを読む",
            hero_btn_github: "GitHubを探索",
            features_title: "コアテクノロジー",
            features_subtitle: "内容、送信者、受信者、検索の4重の隠蔽による完璧な匿名性の保証",
            feature_dksap_title: "DKSAP (ECC)",
            feature_dksap_desc: "Dual-Key Stealth Address Protocol。受信者の固定アドレスを公開せず、使い捨てのステルスアドレスを生成して匿名性を完全に保護します。",
            feature_omr_title: "OMR (FHE)",
            feature_omr_desc: "Oblivious Message Retrieval。ノードが内容を知ることなく、ユーザーのメッセージのみを抽出できる完全同型暗号(TFHE)基盤の検索エンジン。",
            feature_zk_title: "ZK-Proof Fee",
            feature_zk_desc: "ユーザーの身元を明かさずに手数料の支払い能力を証明する、Groth16 ZK-SNARK基盤の革新的な経済モデル。",
            arch_title: "モジュラー・アーキテクチャ",
            arch_subtitle: "Cosmos SDKベースの実行レイヤーとRustベースの暗号化コアの完璧な相互作用",
            arch_exec_title: "Execution Layer (Cosmos SDK + Rollkit)",
            arch_exec_desc: "v1.3アーキテクチャは、ハードフォークなしで経済モデルを導入できる柔軟なスロット構造を提供します。CelestiaをDAレイヤーとして使用し、検閲耐性を確保します。",
            arch_core_title: "Crypto Core (Rust Library)",
            arch_core_desc: "DKSAP、TFHE OMR、Groth16 ZK-Proofなど、高性能な演算が必要な主要暗号ロジックをRustで実装し、究極のパフォーマンスを保証します。",
            roadmap_title: "ロードマップ",
            roadmap_p1_title: "Phase 1-2: 基礎構築",
            roadmap_p1_desc: "セキュリティの強化、安定化、および招待コードシステムの構築が完了しました。",
            roadmap_p3_title: "Phase 3: ディープテック",
            roadmap_p3_desc: "ZK-Proof Feeのプロダクションセキュリティ強化およびクライアント側の実証連動が進行中です。",
            roadmap_p4_title: "Phase 4: メインネットローンチ",
            roadmap_p4_desc: "報酬分配モデルの完成およびメインネットの正式ローンチ。",
            footer_copy: "&copy; 2026 Just Labs Inc. All rights reserved."
        },
        zh: {
            nav_features: "核心技术",
            nav_architecture: "架构设计",
            nav_roadmap: "路线图",
            nav_get_started: "立即开始",
            hero_title: "Sovereign Anonymity with <span class=\"gradient-text\">Zero</span>",
            hero_subtitle: "跨越边界的隐私保护。结合 Cosmos SDK 与高性能 Rust 加密核心的下一代主权回滚（Sovereign Rollup）即时通讯工具。",
            hero_btn_whitepaper: "阅读白皮书",
            hero_btn_github: "探索 GitHub",
            features_title: "核心技术",
            features_subtitle: "通过内容、发送者、接收者和检索的四重隐匿，确保完美的匿名性",
            feature_dksap_title: "DKSAP (ECC)",
            feature_dksap_desc: "双密钥隐身地址协议。不公开接收者的固定地址，而是生成一次性隐身地址，从而完美保护匿名性。",
            feature_omr_title: "OMR (FHE)",
            feature_omr_desc: "遗忘信息检索。基于全同态加密 (TFHE) 的检索引擎，使节点在无需知晓内容的情况下即可检索用户消息。",
            feature_zk_title: "ZK-Proof Fee",
            feature_zk_desc: "创新的经济模型，使用 Groth16 ZK-SNARK 在不泄露用户身份的情况下证明手续费支付能力。",
            arch_title: "模块化架构",
            arch_subtitle: "基于 Cosmos SDK 的执行层与基于 Rust 的加密核心之间的完美协作",
            arch_exec_title: "执行层 (Cosmos SDK + Rollkit)",
            arch_exec_desc: "v1.3 架构提供了灵活的插槽结构，无需硬分叉即可引入经济模型。采用 Celestia 作为 DA 层以确保抗审查性。",
            arch_core_title: "加密核心 (Rust Library)",
            arch_core_desc: "采用高度优化的 Rust 实现 DKSAP、TFHE OMR 和 Groth16 ZK-Proof 等高性能核心加密逻辑。",
            roadmap_title: "路线图",
            roadmap_p1_title: "Phase 1-2: 基础设施",
            roadmap_p1_desc: "安全加固、稳定性优化及邀请码系统构建已完成。",
            roadmap_p3_title: "Phase 3: 深度技术",
            roadmap_p3_desc: "ZK-Proof Fee 生产安全强化及客户端实际证明集成正在进行中。",
            roadmap_p4_title: "Phase 4: 主网发布",
            roadmap_p4_desc: "奖励分配模型完善及主网正式启动。",
            footer_copy: "&copy; 2026 Just Labs Inc. All rights reserved."
        },
        es: {
            nav_features: "Tecnología",
            nav_architecture: "Arquitectura",
            nav_roadmap: "Hoja de Ruta",
            nav_get_started: "Comenzar",
            hero_title: "Sovereign Anonymity with <span class=\"gradient-text\">Zero</span>",
            hero_subtitle: "Privacidad más allá de las fronteras. Un mensajero sovereign rollup de próxima generación que combina Cosmos SDK con núcleos criptográficos Rust de alto rendimiento.",
            hero_btn_whitepaper: "Leer Whitepaper",
            hero_btn_github: "Explorar GitHub",
            features_title: "Tecnologías Básicas",
            features_subtitle: "Anonimato perfecto mediante la cuádruple ocultación: contenido, remitente, receptor y búsqueda.",
            feature_dksap_title: "DKSAP (ECC)",
            feature_dksap_desc: "Dual-Key Stealth Address Protocol. Protege la privacidad del receptor generando direcciones stealth de un solo uso en lugar de exponer direcciones fijas.",
            feature_omr_title: "OMR (FHE)",
            feature_omr_desc: "Oblivious Message Retrieval. Un motor de búsqueda basado en TFHE que recupera mensajes para los usuarios sin que los nodos conozcan el contenido.",
            feature_zk_title: "ZK-Proof Fee",
            feature_zk_desc: "Un modelo económico innovador que utiliza Groth16 ZK-SNARKs para demostrar la solvencia de las tarifas sin revelar la identidad del usuario.",
            arch_title: "Arquitectura Modular",
            arch_subtitle: "Interacción fluida entre las capas de ejecución de Cosmos SDK y los núcleos criptográficos de Rust.",
            arch_exec_title: "Capa de Ejecución (Cosmos SDK + Rollkit)",
            arch_exec_desc: "La arquitectura v1.3 proporciona estructuras de ranuras flexibles para la integración de modelos económicos sin bifurcaciones, utilizando Celestia para DA.",
            arch_core_title: "Núcleo Criptográfico (Biblioteca Rust)",
            arch_core_desc: "Garantiza un rendimiento extremo implementando DKSAP, TFHE OMR y Groth16 ZK-Proofs en lógica Rust optimizada.",
            roadmap_title: "Hoja de Ruta",
            roadmap_p1_title: "Fase 1-2: Fundación",
            roadmap_p1_desc: "Refuerzo de seguridad, estabilización y finalización del sistema de códigos de invitación.",
            roadmap_p3_title: "Fase 3: Tecnología Profunda",
            roadmap_p3_desc: "Refuerzo de la seguridad de producción de ZK-Proof Fee e integración de pruebas del lado del cliente en curso.",
            roadmap_p4_title: "Fase 4: Lanzamiento de Mainnet",
            roadmap_p4_desc: "Finalización de modelos de distribución de recompensas y lanzamiento oficial de Mainnet.",
            footer_copy: "&copy; 2026 Just Labs Inc. All rights reserved."
        }
    };

    function setLanguage(lang) {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                el.innerHTML = translations[lang][key];
            }
        });
        document.getElementById('lang-btn').textContent = lang.toUpperCase();
        localStorage.setItem('zero_lang', lang);
        document.documentElement.lang = lang;
    }

    // Language Dropdown Logic
    const langBtn = document.getElementById('lang-btn');
    const langDropdown = document.getElementById('lang-dropdown');

    if (langBtn && langDropdown) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('show');
        });

        langDropdown.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.getAttribute('data-lang');
                setLanguage(lang);
                langDropdown.classList.remove('show');
            });
        });

        document.addEventListener('click', () => {
            langDropdown.classList.remove('show');
        });
    }

    // Language Detection
    function initLanguage() {
        const savedLang = localStorage.getItem('zero_lang');
        if (savedLang) {
            setLanguage(savedLang);
        } else {
            const browserLang = navigator.language.slice(0, 2);
            const supportedLangs = ['ko', 'en', 'ja', 'zh', 'es'];
            const defaultLang = supportedLangs.includes(browserLang) ? browserLang : 'en';
            setLanguage(defaultLang);
        }
    }

    initLanguage();

    // Smooth scroll for nav links
    document.querySelectorAll('.nav-links a, .hero-btns a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
});
