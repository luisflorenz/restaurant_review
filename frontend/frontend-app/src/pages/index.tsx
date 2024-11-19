import { AppBar } from "@/components/AppBar";
import ReviewCard from "@/components/ReviewCard";
import { useEffect, useState } from "react";
import { Review } from "@/models/Review";
import * as web3 from "@solana/web3.js";
import { fetchReviews } from "@/util/fetchReviews";
import { useWallet } from "@solana/wallet-adapter-react";
import ReviewForm from "@/components/Form";

const REVIEW_PROGRAM_ID = "2xuLAJcbZTqZJ3DNf3DcHgRg7a1dBmtfLnjyvgkNq286";

export default function Home() {
    const connection = new web3.Connection(web3.clusterApiUrl("devnet"));
    const { publicKey, sendTransaction } = useWallet();
    const [txid, setTxid] = useState("");

    const [reviews, setReviews] = useState<Review[]>([]);

    const [title, setTitle] = useState("");
    const [rating, setRating] = useState(0);
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState(""); // Added location state

    // Fetch reviews on component mount
    useEffect(() => {
        const fetchAccounts = async () => {
            await fetchReviews(REVIEW_PROGRAM_ID, connection).then(setReviews);
        };
        fetchAccounts();
    }, []);

    // Handle form submission
    const handleSubmit = () => {
        const review = new Review(title, rating, description, location); // Include location in Review
        handleTransactionSubmit(review);
    };

    // Handle Solana transaction submission
    const handleTransactionSubmit = async (review: Review) => {
        if (!publicKey) {
            alert("Please connect your wallet!");
            return;
        }

        const buffer = review.serialize();
        const transaction = new web3.Transaction();

        // Derive PDA
        const [pda] = web3.PublicKey.findProgramAddressSync(
            [publicKey.toBuffer(), Buffer.from(review.title)],
            new web3.PublicKey(REVIEW_PROGRAM_ID)
        );

        const instruction = new web3.TransactionInstruction({
            keys: [
                {
                    pubkey: publicKey,
                    isSigner: true,
                    isWritable: false,
                },
                {
                    pubkey: pda,
                    isSigner: false,
                    isWritable: true,
                },
                {
                    pubkey: web3.SystemProgram.programId,
                    isSigner: false,
                    isWritable: false,
                },
            ],
            data: buffer,
            programId: new web3.PublicKey(REVIEW_PROGRAM_ID),
        });

        transaction.add(instruction);

        try {
            let txid = await sendTransaction(transaction, connection);
            setTxid(
                `Transaction submitted: https://explorer.solana.com/tx/${txid}?cluster=devnet`
            );
        } catch (e) {
            console.error("Transaction error:", e);
            alert("Transaction failed!");
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
                <AppBar />
            </div>

            {/* Review Form */}
            <div className="after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700/10 after:dark:from-sky-900 after:dark:via-[#0141ff]/40 before:lg:h-[360px]">
                <ReviewForm
                    title={title}
                    description={description}
                    rating={rating}
                    location={location} // Added location prop
                    setTitle={setTitle}
                    setDescription={setDescription}
                    setRating={setRating}
                    setLocation={setLocation} // Added location setter
                    handleSubmit={handleSubmit}
                />
            </div>

            {/* Display Transaction ID */}
            {txid && <div>{txid}</div>}

            {/* Render Reviews */}
            <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-3 lg:text-left">
                {reviews &&
                    reviews.map((review) => (
                        <ReviewCard key={review.title} review={review} />
                    ))}
            </div>
        </main>
    );
}