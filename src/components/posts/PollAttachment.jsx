import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useUserContext } from '../../contexts/UserContext';
import toast from 'react-hot-toast';
import './PollAttachment.css';

const PollAttachment = ({ post }) => {
    const { user: currentUser } = useUserContext();
    const queryClient = useQueryClient();
    const poll = post.attachment;

    const [votedOptionId, setVotedOptionId] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (currentUser && poll.voters) {
            setVotedOptionId(poll.voters[currentUser.uid] || null);
        }
    }, [poll.voters, currentUser]);

    const voteMutation = useMutation(
        async (optionId) => {
            if (!currentUser) throw new Error("Потрібно увійти, щоб голосувати.");
            if (votedOptionId) throw new Error("Ви вже проголосували.");

            setIsProcessing(true);
            const postRef = doc(db, 'posts', post.id);

            await runTransaction(db, async (transaction) => {
                const postDoc = await transaction.get(postRef);
                if (!postDoc.exists()) throw new Error("Допис не знайдено.");

                const currentPoll = postDoc.data().attachment;
                
                // Перевіряємо ще раз всередині транзакції
                if (currentPoll.voters && currentPoll.voters[currentUser.uid]) {
                    // Користувач якось проголосував, поки йшов запит
                    return; 
                }

                const newOptions = currentPoll.options.map(opt => {
                    if (opt.id === optionId) {
                        return { ...opt, votes: (opt.votes || 0) + 1 };
                    }
                    return opt;
                });

                const newTotalVotes = (currentPoll.totalVotes || 0) + 1;
                const newVoters = { ...currentPoll.voters, [currentUser.uid]: optionId };

                const newAttachment = {
                    ...currentPoll,
                    options: newOptions,
                    totalVotes: newTotalVotes,
                    voters: newVoters,
                };
                
                transaction.update(postRef, { attachment: newAttachment });
            });
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['feedPosts', null]);
            },
            onError: (error) => {
                toast.error(error.message);
            },
            onSettled: () => {
                setIsProcessing(false);
            }
        }
    );

    const handleVote = (optionId) => {
        if (!isProcessing && !votedOptionId) {
            voteMutation.mutate(optionId);
        }
    };
    
    return (
        <div className="poll-container">
            <p className="poll-question">{poll.question}</p>
            <div className="poll-options">
                {poll.options.map(option => {
                    const percentage = poll.totalVotes > 0 ? ((option.votes || 0) / poll.totalVotes) * 100 : 0;
                    const isVotedByUser = votedOptionId === option.id;

                    return (
                        <div key={option.id} className="poll-option-wrapper">
                            <button
                                className={`poll-option ${votedOptionId ? 'voted' : ''} ${isVotedByUser ? 'user-choice' : ''}`}
                                onClick={() => handleVote(option.id)}
                                disabled={!!votedOptionId || isProcessing}
                            >
                                <div className="poll-option-background" style={{ width: `${votedOptionId ? percentage : 0}%` }}></div>
                                <span className="poll-option-text">{option.text}</span>
                                {votedOptionId && (
                                    <span className="poll-option-percentage">{percentage.toFixed(0)}%</span>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
            <div className="poll-footer">
                <span>{poll.totalVotes || 0} голосів</span>
            </div>
        </div>
    );
};

export default PollAttachment;