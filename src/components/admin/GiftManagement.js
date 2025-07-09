import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { db, storage } from '../../services/firebase';
import { collection, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useUserContext } from '../../contexts/UserContext';
import toast from 'react-hot-toast';
import './GiftManagement.css';

const GiftManagement = () => {
    const { user } = useUserContext();
    const queryClient = useQueryClient();

    const [giftName, setGiftName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState(100);
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const { data: gifts, isLoading } = useQuery('allGifts', () =>
        getDocs(collection(db, 'gifts')).then(snap =>
            snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        )
    );

    const addGiftMutation = useMutation(async (newGiftData) => {
        if (!file) throw new Error("Файл не обрано");
        setIsUploading(true);
        toast.loading('Завантаження файлу...');

        const fileRef = ref(storage, `gifts_media/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const mediaUrl = await getDownloadURL(fileRef);
        
        toast.loading('Збереження подарунка...');
        const docData = {
            ...newGiftData,
            mediaUrl,
            mediaType: file.name.endsWith('.json') ? 'lottie' : 'webp',
            creatorId: user.uid,
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'gifts'), docData);
    }, {
        onSuccess: () => {
            toast.dismiss();
            toast.success('Подарунок успішно додано!');
            queryClient.invalidateQueries('allGifts');
            setGiftName('');
            setDescription('');
            setPrice(100);
            setFile(null);
        },
        onError: (error) => {
            toast.dismiss();
            toast.error(`Помилка: ${error.message}`);
        },
        onSettled: () => {
            setIsUploading(false);
        }
    });

    const deleteGiftMutation = useMutation(async (giftToDelete) => {
        toast.loading('Видалення подарунка...');
        // Delete from Storage
        const fileRef = ref(storage, giftToDelete.mediaUrl);
        await deleteObject(fileRef).catch(err => console.warn("Could not delete file from storage", err));
        
        // Delete from Firestore
        await deleteDoc(doc(db, 'gifts', giftToDelete.id));
    }, {
        onSuccess: () => {
            toast.dismiss();
            toast.success('Подарунок видалено!');
            queryClient.invalidateQueries('allGifts');
        },
        onError: (error) => {
            toast.dismiss();
            toast.error(`Помилка: ${error.message}`);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        addGiftMutation.mutate({ name: giftName, description, price: Number(price) });
    };

    return (
        <div className="gift-management-container">
            <form onSubmit={handleSubmit} className="gift-upload-form">
                <h3>Додати новий подарунок</h3>
                <input type="text" value={giftName} onChange={e => setGiftName(e.target.value)} placeholder="Назва подарунка" required />
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Опис" required />
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Ціна в 'Нотах'" required />
                <input type="file" onChange={e => setFile(e.target.files[0])} accept=".json, .webp" required />
                <button type="submit" disabled={isUploading}>{isUploading ? 'Завантаження...' : 'Додати подарунок'}</button>
            </form>

            <div className="existing-gifts-list">
                <h3>Існуючі подарунки</h3>
                {isLoading ? <p>Завантаження...</p> : (
                    <table>
                        <thead>
                            <tr>
                                <th>Назва</th>
                                <th>Ціна</th>
                                <th>Дія</th>
                            </tr>
                        </thead>
                        <tbody>
                            {gifts.map(gift => (
                                <tr key={gift.id}>
                                    <td>{gift.name}</td>
                                    <td>{gift.price} Нот</td>
                                    <td><button className="delete-btn" onClick={() => deleteGiftMutation.mutate(gift)}>Видалити</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default GiftManagement;