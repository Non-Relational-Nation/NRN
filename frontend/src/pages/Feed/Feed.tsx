import "./styles.css";

import Layout from "../../components/Layout/Layout";
import PostList from "../../components/Posts/PostList";
import { getFeed } from "../../api/posts";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

export default function Feed() {

    const { data, isLoading, error, fetchNextPage, hasNextPage } =
        useInfiniteQuery({
            queryKey: ["feed"],
            queryFn: ({ pageParam }) => getFeed({ pageParam: pageParam ?? 0 }),
            getNextPageParam: (lastPage) => lastPage.nextOffset,
            initialPageParam: 0,
            retry: false,
            refetchOnWindowFocus: false,
        });

    const bottomRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!bottomRef.current || !hasNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    fetchNextPage();
                }
            },
            { threshold: 1 }
        );

        observer.observe(bottomRef.current);

        return () => observer.disconnect();
    }, [hasNextPage, fetchNextPage]);

    const posts = data?.pages.flatMap((page) => page.items) ?? [];
    return (
        <Layout loading={isLoading} error={error}>
            <section id="feed-container">
                <PostList posts={posts ?? []} />
                <div ref={bottomRef} className="h-px" />
            </section>
        </Layout>
    );
}
