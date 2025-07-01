import React, { useState, useEffect } from 'react';
import { useUserContext } from './UserContext';
import { db } from './firebase';
import { doc, runTransaction, increment } from 'firebase/firestore';
import { usePlayerContext } from './PlayerContext';
import { motion } from 'framer-motion';
import PurchaseNotesModal from './PurchaseNotesModal';
import AnimatedCounter from './AnimatedCounter';
import Lottie from 'lottie-react';
// Анімацію тепер імпортуємо динамічно, тому статичний імпорт видаляємо
import './WalletTab.css';

const NoteIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;

const notePackages = [
    { notes: 50, price: 50, popular: false },
    { notes: 100, price: 100, popular: true },
    { notes: 250, price: 250, popular: false },
    { notes: 500, price: 500, popular: false },
];


const WalletTab = () => {
    const { user, refreshUser } = useUserContext();
    const { showNotification } = usePlayerContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [isPurchasing, setIsPurchasing] = useState(false);

    // --- ПОЧАТОК ЗМІН: Логіка для динамічного завантаження анімації ---
    const [knitlyNoteAnimation, setKnitlyNoteAnimation] = useState(null);

    useEffect(() => {
        // Динамічно імпортуємо JSON-файл
        import('./animations/knitly-note.json')
            .then((animationData) => {
                // Встановлюємо дані анімації в стан
                setKnitlyNoteAnimation(animationData.default);
            })
            .catch(error => {
                console.error("Не вдалося завантажити Lottie анімацію:", error);
            });
    }, []); // Пустий масив залежностей, щоб ефект виконавсь один раз
    // --- КІНЕЦЬ ЗМІН ---


    const handleOpenModal = (pack) => {
        setSelectedPackage(pack);
        setIsModalOpen(true);
    };

    const handleConfirmPurchase = async () => {
        if (!user || !selectedPackage) return;
        setIsPurchasing(true);

        const userRef = doc(db, 'users', user.uid);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) {
                    throw "Користувача не знайдено!";
                }
                transaction.update(userRef, { notesBalance: increment(selectedPackage.notes) });
            });
            await refreshUser();
            showNotification(`Баланс поповнено на ${selectedPackage.notes} Нот!`, 'info');
        } catch (error) {
            console.error("Помилка поповнення балансу:", error);
            showNotification("Не вдалося поповнити баланс. Спробуйте ще раз.", "error");
        } finally {
            setIsPurchasing(false);
            setIsModalOpen(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div 
            className="wallet-tab-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <h3>Гаманець</h3>

            <motion.div className="balance-card" variants={itemVariants}>
                <div className="balance-info">
                    <p>Ваш поточний баланс</p>
                    <div className="balance-amount">
                        {/* --- ЗМІНА: Умовний рендеринг анімації --- */}
                        {knitlyNoteAnimation && (
                            <Lottie animationData={knitlyNoteAnimation} loop={true} className="balance-note-icon" />
                        )}
                        <AnimatedCounter count={user?.notesBalance || 0} />
                    </div>
                </div>
                <button className="button-primary" onClick={() => document.getElementById('purchase-section')?.scrollIntoView({ behavior: 'smooth' })}>
                    Поповнити
                </button>
            </motion.div>

            <motion.div id="purchase-section" variants={itemVariants}>
                <h4 className="section-title">Поповнити баланс</h4>
                <div className="packages-grid">
                    {notePackages.map((pack, index) => (
                        <motion.div 
                            key={index} 
                            className={`package-card ${pack.popular ? 'popular' : ''}`}
                            whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.2)" }}
                            variants={itemVariants}
                        >
                            {pack.popular && <div className="popular-badge">Популярне</div>}
                            <div className="package-notes">
                                <NoteIcon />
                                <span>{pack.notes}</span>
                            </div>
                            <p className="package-price">{pack.price} грн</p>
                            <button className="button-secondary" onClick={() => handleOpenModal(pack)}>
                                Придбати
                            </button>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            <motion.div variants={itemVariants}>
                <h4 className="section-title">Історія транзакцій</h4>
                <div className="transaction-history-placeholder">
                    <p>Тут буде відображатися історія ваших поповнень та витрат.</p>
                </div>
            </motion.div>

            {selectedPackage && (
                <PurchaseNotesModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleConfirmPurchase}
                    pack={selectedPackage}
                    isPurchasing={isPurchasing}
                    // --- ЗМІНА: Передаємо анімацію в модальне вікно ---
                    animationData={knitlyNoteAnimation}
                />
            )}
        </motion.div>
    );
};

export default WalletTab;