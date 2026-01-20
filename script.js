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
            nav_features: "Invisible Engine",
            nav_architecture: "아키텍처",
            nav_roadmap: "로드맵",
            nav_get_started: "이용하기",
            hero_title: "당신과 대화 상대방만 볼 수 있는 대화",
            hero_subtitle: "중앙 서버도, 감시자도 없습니다. 개발사인 저희조차 당신의 메시지를 볼 수 없습니다. Zero는 세계 최고 수준의 암호화 기술로 완벽한 익명성을 보장합니다.",
            hero_btn_whitepaper: "화이트페이퍼 읽기",
            waitlist_title: "현재 개발 중입니다",
            waitlist_description: "Zero 출시 시 알림을 보내드리겠습니다. 이메일 주소 또는 휴대폰 번호를 남겨주세요.",
            waitlist_placeholder: "이메일 또는 휴대폰 번호",
            waitlist_submit: "알림 받기",
            waitlist_success: "감사합니다! 출시 시 연락드리겠습니다.",
            waitlist_error: "올바른 이메일 또는 휴대폰 번호를 입력해주세요.",
            trust_title: "깨지지 않는 신뢰",
            trust_subtitle: "Zero는 수학적으로 프라이버시가 보호되도록 설계되었습니다. 사람의 개입 가능성을 원천 차단하여 당신의 데이터는 오직 당신만의 것으로 남습니다.",
            trust_server_title: "영지식 증명 (Zero Knowledge)",
            trust_server_desc: "서버는 오직 암호화된 노이즈만 봅니다. 당신의 신원과 메시지 내용은 네트워크 운영자에게도 보이지 않습니다.",
            trust_keys_title: "주권적 열쇠 (Sovereign Keys)",
            trust_keys_desc: "열쇠는 당신이 가집니다. 저희는 당신의 비밀번호나 메시지에 접근할 수 없으므로, 이를 복구하거나 훔쳐볼 수 없습니다.",
            trust_logs_title: "로그 제로 (Zero Logs)",
            trust_logs_desc: "Zero는 IP, 메타데이터, 연락처를 기록하지 않습니다. 당신의 디지털 발자국은 완벽히 지워집니다.",
            features_title: "보이지 않는 엔진 (Invisible Engine)",
            features_subtitle: "절대적 프라이버시를 구현하는 핵심 암호화 프로토콜",
            feature_dksap_title: "DKSAP (ECC)",
            feature_dksap_desc: "Dual-Key Stealth Address Protocol. 수신자의 고정 주소를 노출하지 않고 일회용 stealth address를 생성하여 익명성을 완벽히 보호합니다.",
            feature_omr_title: "OMR (FHE)",
            feature_omr_desc: "Oblivious Message Retrieval. 노드가 메시지 내용을 알지 못한 채 사용자의 메시지만 골라낼 수 있는 완전 동형 암호화(TFHE) 기반 검색 엔진.",
            feature_zk_title: "ZK-Proof Fee",
            feature_zk_desc: "사용자의 신원을 밝히지 않고도 수수료 지불 능력을 증명하는 Groth16 ZK-SNARK 기반의 혁신적인 경제 모델.",
            arch_title: "Modular Architecture",
            arch_subtitle: "Cosmos 기반 실행 레이어와 Rust 기반 암호화 코어의 완벽한 상호작용",
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
            nav_features: "Invisible Engine",
            nav_architecture: "Architecture",
            nav_roadmap: "Roadmap",
            nav_get_started: "Use Now",
            hero_title: "Conversations that only you see",
            hero_subtitle: "No central servers, no prying eyes. Not even we can see your messages. Zero ensures absolute anonymity using world-class cryptographic technology.",
            hero_btn_whitepaper: "Read Whitepaper",
            waitlist_title: "Currently in Development",
            waitlist_description: "We'll notify you when Zero launches. Please leave your email or phone number.",
            waitlist_placeholder: "Email or Phone Number",
            waitlist_submit: "Get Notified",
            waitlist_success: "Thank you! We'll contact you at launch.",
            waitlist_error: "Please enter a valid email or phone number.",
            trust_title: "Unbreakable Trust",
            trust_subtitle: "Zero is designed to be mathematically private. We eliminated the human factor so your data stays yours, always.",
            trust_server_title: "Zero Knowledge Proof",
            trust_server_desc: "Our servers only see encrypted noise. Your identity and message content are invisible to the network operator.",
            trust_keys_title: "Sovereign Keys",
            trust_keys_desc: "You own the keys. We can't recover your password or messages because we never have access to them.",
            trust_logs_title: "Zero Logs",
            trust_logs_desc: "Zero doesn't log your IP, metadata, or contact list. Your digital footprint is truly erased.",
            features_title: "The Invisible Engine",
            features_subtitle: "Core cryptographic protocols that enable absolute privacy",
            feature_dksap_title: "DKSAP (ECC)",
            feature_dksap_desc: "Dual-Key Stealth Address Protocol. Hides the receiver's identity by generating a one-time address for every message.",
            feature_omr_title: "OMR (FHE)",
            feature_omr_desc: "Oblivious Message Retrieval. Uses Fully Homomorphic Encryption to find your messages without the node knowing which ones are yours.",
            feature_zk_title: "ZK-Proof Fee",
            feature_zk_desc: "An innovative economic model using Groth16 ZK-SNARKs to prove fee solvency without revealing user identity.",
            arch_title: "Modular Architecture",
            arch_subtitle: "Seamless interaction between Cosmos execution layers and Rust cryptographic cores.",
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
            nav_features: "Invisible Engine",
            nav_architecture: "アーキテクチャ",
            nav_roadmap: "ロードマップ",
            nav_get_started: "利用する",
            hero_title: "あなたと相手だけが見ることができる会話",
            hero_subtitle: "中央サーバーも、監視者もありません。開発元である私たちでさえ、あなたのメッセージを見ることはできません。Zeroは世界最高水準の暗号化技術で完全な匿名性を保証します。",
            hero_btn_whitepaper: "ホワイトペーパーを読む",
            waitlist_title: "現在開発中です",
            waitlist_description: "Zeroのローンチ時に通知いたします。メールアドレスまたは電話番号をご入力ください。",
            waitlist_placeholder: "メールアドレスまたは電話番号",
            waitlist_submit: "通知を受け取る",
            waitlist_success: "ありがとうございます！ローンチ時にご連絡いたします。",
            waitlist_error: "有効なメールアドレスまたは電話番号を入力してください。",
            trust_title: "破られない信頼",
            trust_subtitle: "Zeroは数学的にプライバシーが保護されるように設計されています。人間の介入を排除し、あなたのデータはあなただけのものになります。",
            trust_server_title: "ゼロ知識証明",
            trust_server_desc: "サーバーは暗号化されたノイズしか見ることができません。あなたの身元やメッセージの内容は、ネットワーク運用者にも見えません。",
            trust_keys_title: "主権的鍵",
            trust_keys_desc: "鍵はあなたが所有します。私たちはあなたのパスワードやメッセージにアクセスできないため、復元したり盗み見たりすることはできません。",
            trust_logs_title: "ログ・ゼロ",
            trust_logs_desc: "ZeroはIP、メタデータ、連絡先を記録しません。 あなたのデジタル足跡は完全に消去されます。",
            features_title: "見えないエンジン (Invisible Engine)",
            features_subtitle: "絶対的プライバシーを実現するコア暗号化プロトコル",
            feature_dksap_title: "DKSAP (ECC)",
            feature_dksap_desc: "Dual-Key Stealth Address Protocol。受信者の固定アドレスを公開せず、使い捨てのステルスアドレスを生成して匿名性を完全に保護します。",
            feature_omr_title: "OMR (FHE)",
            feature_omr_desc: "Oblivious Message Retrieval。ノードが内容を知ることなく、ユーザーのメッセージのみを抽出できる完全同型暗号(TFHE)基盤の検索エンジン。",
            feature_zk_title: "ZK-Proof Fee",
            feature_zk_desc: "ユーザーの身元を明かさずに手数料の支払い能力を証明する、Groth16 ZK-SNARK基盤の革新的な経済モデル。",
            arch_title: "モジュラー・アーキテクチャ",
            arch_subtitle: "Cosmosベースの実行レイヤーとRustベースの暗号化コアの完璧な相互作用",
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
            nav_features: "隐形引擎",
            nav_architecture: "架构设计",
            nav_roadmap: "路线图",
            nav_get_started: "立即使用",
            hero_title: "只有你和对方能看到的对话",
            hero_subtitle: "没有中央服务器，没有监视者。甚至连我们（开发团队）也无法查看你的信息。Zero 利用世界顶级加密技术确保绝对的数据匿名。",
            hero_btn_whitepaper: "阅读白皮书",
            waitlist_title: "正在开发中",
            waitlist_description: "Zero 上线时我们将通知您。请留下您的电子邮件或电话号码。",
            waitlist_placeholder: "电子邮件或电话号码",
            waitlist_submit: "接收通知",
            waitlist_success: "谢谢！我们将在上线时联系您。",
            waitlist_error: "请输入有效的电子邮件或电话号码。",
            trust_title: "不可逾越的信任",
            trust_subtitle: "Zero 在数学设计上确保隐私。我们消除了人为干预，让你的数据永远只属于你。",
            trust_server_title: "零知识证明",
            trust_server_desc: "我们的服务器只能看到加密的噪声。网络运营商无法看到你的身份和消息内容。",
            trust_keys_title: "主权密钥",
            trust_keys_desc: "你拥有密钥。我们无法访问你的密码或消息，因此也无法恢复或查看它们。",
            trust_logs_title: "零日志",
            trust_logs_desc: "Zero 不记录你的 IP、元数据或联系人列表。你的数字足迹被真正抹除。",
            features_title: "隐形引擎 (Invisible Engine)",
            features_subtitle: "实现绝对隐私的核心加密协议",
            feature_dksap_title: "DKSAP (ECC)",
            feature_dksap_desc: "双密钥隐身地址协议。不公开接收者的固定地址，而是生成一次性隐身地址，从而完美保护匿名性。",
            feature_omr_title: "OMR (FHE)",
            feature_omr_desc: "遗忘信息检索。基于全同态加密 (TFHE) 的检索引擎，使节点在无需知晓内容的情况下即可检索用户消息。",
            feature_zk_title: "ZK-Proof Fee",
            feature_zk_desc: "创新的经济模型，使用 Groth16 ZK-SNARK 在不泄露用户身份的情况下证明手续费支付能力。",
            arch_title: "模块化架构",
            arch_subtitle: "基于 Cosmos 的执行层与基于 Rust 的加密核心之间的完美协作",
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
            nav_features: "Motor Invisible",
            nav_architecture: "Arquitectura",
            nav_roadmap: "Hoja de Ruta",
            nav_get_started: "Usar Ahora",
            hero_title: "Conversaciones que solo tú ves",
            hero_subtitle: "Sin servidores centrales, sin miradas indiscretas. Ni siquiera nosotros podemos ver tus mensajes. Zero garantiza el anonimato absoluto mediante tecnología criptográfica de clase mundial.",
            hero_btn_whitepaper: "Leer Whitepaper",
            waitlist_title: "Actualmente en Desarrollo",
            waitlist_description: "Te notificaremos cuando Zero se lance. Por favor, deja tu correo electrónico o número de teléfono.",
            waitlist_placeholder: "Correo Electrónico o Teléfono",
            waitlist_submit: "Recibir Notificación",
            waitlist_success: "¡Gracias! Te contactaremos en el lanzamiento.",
            waitlist_error: "Por favor, ingresa un correo electrónico o teléfono válido.",
            trust_title: "Confianza Inquebrantable",
            trust_subtitle: "Zero está diseñado para ser matemáticamente privado. Eliminamos el factor humano para que tus datos sigan siendo tuyos, siempre.",
            trust_server_title: "Prueba de Conocimiento Cero",
            trust_server_desc: "Nuestros servidores solo ven ruido cifrado. Tu identidad y el contenido de los mensajes son invisibles para el operador de la red.",
            trust_keys_title: "Llaves Soberanas",
            trust_keys_desc: "Tú eres el dueño de las llaves. No podemos recuperar tu contraseña ni tus mensajes porque nunca tenemos acceso a ellos.",
            trust_logs_title: "Zero Logs",
            trust_logs_desc: "Zero no registra tu IP, metadatos ni lista de contactos. Tu huella digital se borra de verdad.",
            features_title: "El Motor Invisible (Invisible Engine)",
            features_subtitle: "Protocolos criptográficos fundamentales que permiten privacidad absoluta",
            feature_dksap_title: "DKSAP (ECC)",
            feature_dksap_desc: "Dual-Key Stealth Address Protocol. Protege la privacidad del receptor generando direcciones stealth de un solo uso en lugar de exponer direcciones fijas.",
            feature_omr_title: "OMR (FHE)",
            feature_omr_desc: "Oblivious Message Retrieval. Un motor de búsqueda basado en TFHE que recupera mensajes para los usuarios sin que los nodos conozcan el contenido.",
            feature_zk_title: "ZK-Proof Fee",
            feature_zk_desc: "Un modelo económico innovador que utiliza Groth16 ZK-SNARKs para demostrar la solvencia de las tarifas sin revelar la identidad del usuario.",
            arch_title: "Arquitectura Modular",
            arch_subtitle: "Interacción fluida entre las capas de ejecución de Cosmos y los núcleos criptográficos de Rust.",
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

    // Waitlist Popup Logic
    const waitlistOverlay = document.getElementById('waitlist-overlay');
    const waitlistClose = document.getElementById('waitlist-close');
    const waitlistForm = document.getElementById('waitlist-form');
    const waitlistInput = document.getElementById('waitlist-input');
    const waitlistMessage = document.getElementById('waitlist-message');

    // Open popup when "이용하기" buttons are clicked
    const getStartedButtons = document.querySelectorAll('[data-i18n="nav_get_started"]');
    getStartedButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            waitlistOverlay.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        });
    });

    // Close popup
    function closeWaitlist() {
        waitlistOverlay.classList.remove('show');
        document.body.style.overflow = ''; // Restore scroll
        waitlistMessage.classList.remove('show', 'success', 'error');
        waitlistForm.reset();
    }

    waitlistClose.addEventListener('click', closeWaitlist);

    // Close on overlay click (not modal)
    waitlistOverlay.addEventListener('click', (e) => {
        if (e.target === waitlistOverlay) {
            closeWaitlist();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && waitlistOverlay.classList.contains('show')) {
            closeWaitlist();
        }
    });

    // Form validation and submission
    waitlistForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const contact = waitlistInput.value.trim();
        const currentLang = localStorage.getItem('zero_lang') || 'en';

        // Simple validation (email or phone)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[\d\s\-\+\(\)]{8,}$/;

        if (!emailRegex.test(contact) && !phoneRegex.test(contact)) {
            showMessage('error', translations[currentLang].waitlist_error);
            return;
        }
        // Send to backend API
        const submitBtn = waitlistForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = '...';

            // Mock mode for local testing
            const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:';
            if (isLocal) {
                console.log('Local Mode: Simulating API submission...', { contact, language: currentLang });
                await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
                showMessage('success', translations[currentLang].waitlist_success);
                waitlistForm.reset();
                setTimeout(() => closeWaitlist(), 2500);
                return;
            }

            const response = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contact, language: currentLang })
            });

            const result = await response.json();

            if (response.ok) {
                showMessage('success', translations[currentLang].waitlist_success);
                waitlistForm.reset();
                setTimeout(() => {
                    closeWaitlist();
                }, 3000);
            } else {
                showMessage('error', result.error || translations[currentLang].waitlist_error);
            }
        } catch (error) {
            console.error('Waitlist error:', error);
            showMessage('error', translations[currentLang].waitlist_error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });

    function showMessage(type, text) {
        waitlistMessage.textContent = text;
        waitlistMessage.className = 'waitlist-message show ' + type;
    }

    // Update placeholder translation when language changes
    function updatePlaceholders(lang) {
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (translations[lang] && translations[lang][key]) {
                el.placeholder = translations[lang][key];
            }
        });
    }

    // Override setLanguage to include placeholder updates
    const originalSetLanguage = setLanguage;
    setLanguage = function (lang) {
        originalSetLanguage(lang);
        updatePlaceholders(lang);
    };

    // Initialize placeholders
    const initialLang = localStorage.getItem('zero_lang') || 'en';
    updatePlaceholders(initialLang);
});
