import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query'; // Або 'react-query'
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase'; // ВИПРАВЛЕНО шлях
import { useUserContext } from '../../UserContext'; // ВИПРАВЛЕНО на useUserContext
import toast from 'react-hot-toast';
import default_picture from '../../img/Default-Images/default-picture.svg';

const CreatePostForm = () => {
  const { user } = useUserContext(); // ВИПРАВЛЕНО
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const createPostMutation = useMutation({
    mutationFn: async (newPostData) => {
      const postsCollectionRef = collection(db, 'posts');
      // Додаємо документ в колекцію posts
      const docRef = await addDoc(postsCollectionRef, newPostData);
      
      // Оновлюємо сам документ, додаючи йому власний ID
      await updateDoc(docRef, { postId: docRef.id });

      // Оновлюємо лічильник постів у користувача (якщо він є)
      if (user?.uid) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { postsCount: increment(1) });
      }
    },
    onSuccess: () => {
      toast.success('Ваш допис опубліковано!');
      reset();
      // ІНВАЛІДАЦІЯ ЗАПИТУ: кажемо React Query оновити дані стрічки
      queryClient.invalidateQueries('feedPosts');
    },
    onError: (error) => {
      toast.error('Сталася помилка. Спробуйте ще раз.');
      console.error('Error creating post:', error);
    },
  });

  const onSubmit = (data) => {
    if (!user) {
      toast.error('Потрібно увійти в акаунт, щоб створити допис.');
      return;
    }

    const newPost = {
      text: data.postText,
      authorId: user.uid,
      authorUsername: user.nickname, // Використовуємо nickname
      authorAvatarUrl: user.photoURL,  // Використовуємо photoURL
      createdAt: serverTimestamp(),
      likesCount: 0,
      commentsCount: 0,
      giftsCount: 0,
      attachment: null,
      poll: null,
      isEdited: false,
    };
    createPostMutation.mutate(newPost);
  };

  // Тут я додаю базову стилізацію, використовуючи ваші існуючі класи
  if (!user) {
    return <p className="auth-switch-link">Будь ласка, <a href="/login">увійдіть</a>, щоб поділитися своїми думками.</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="create-post-form">
      <div className="form-header">
        <img src={user.photoURL || default_picture} alt="Ваш аватар" className="user-avatar" />
        <textarea
          {...register('postText', {
            required: 'Допис не може бути порожнім',
            maxLength: {
              value: 1000,
              message: 'Допис не може містити більше 1000 символів',
            },
          })}
          placeholder={`Що нового, ${user.displayName}?`}
          className="post-textarea"
          rows="3"
          disabled={createPostMutation.isLoading}
        />
      </div>
      {errors.postText && <p className="error-message">{errors.postText.message}</p>}
      <div className="form-footer">
        <button type="submit" className="button-primary" disabled={createPostMutation.isLoading}>
          {createPostMutation.isLoading ? 'Публікуємо...' : 'Опублікувати'}
        </button>
      </div>
    </form>
  );
};

export default CreatePostForm;