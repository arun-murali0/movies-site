import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import axios from "axios";
import { toast } from "react-toastify";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../utils/firebase";
import "./style.css";

import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import useFetch from "../../../hooks/useFetch";
import Genres from "../../../components/genres/Genres";
import CircleRating from "../../../components/circleRating/CircleRating";
import Img from "../../../components/lazyLoadImage/Img.jsx";
import PosterFallback from "../../../assets/no-poster.png";
import { PlayIcon } from "../Playbtn";
import VideoPopup from "../../../components/videoPopup/VideoPopup";
import { GrAddCircle } from "react-icons/gr";

const DetailsBanner = ({ video, crew, user }) => {
  const [show, setShow] = useState(false);
  const [videoId, setVideoId] = useState(null);
  const [comments, setComments] = useState([]);
  const { mediaType, id } = useParams();
  const [name, setName] = useState([]);
  const [del, setDel] = useState("");
  const { data, loading } = useFetch(`/${mediaType}/${id}`);
  const [fetchComment, setFetchComment] = useState([]);

  const collectionRef = collection(db, "users");
  useEffect(() => {
    const getName = async () => {
      const data = await getDocs(collectionRef);
      setName(data?.docs?.map((doc) => ({ ...doc.data() })));
    };
    getName();
  }, []);

  useEffect(() => {
    if (data?.id !== undefined && data?.id !== null) {
      const MovieId = { MovieId: data?.id };
      axios
        .get("/getcomment", { params: MovieId })
        .then((res) => {
          setFetchComment(res?.data?.data?.comments);
        });
    }
  }, [data, del, fetchComment, comments, name]);

  const { url } = useSelector((state) => state.home);

  const _genres = data?.genres?.map((g) => g.id);

  const director = crew?.filter((f) => f.job === "Director");
  const writer = crew?.filter(
    (f) => f.job === "Screenplay" || f.job === "Story" || f.job === "Writer"
  );

  const toHoursAndMinutes = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ""}`;
  };

  const handleChange = (e) => {
    setComments(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let newComments = {
      user,
      comments,
      Movie_id: data?.id,
      name: data?.original_title,
    };

    axios
      .post("/comments", newComments)
      .then((res) => {
        setComments({ ...comments, newComments });
        toast.success("comments added successfully");
      })
      .catch((err) => toast.error(err.code));
  };

  const addList = () => {
    if (data && data.poster_path !== null && data.poster_path !== undefined) {
      let addData = {
        email: user,
        Movie_id: data.id,
        poster: data.poster_path,
        name: data.original_title,
        genres: data.genres,
        release_date: data.release_date,
      };

      axios
        .post("/add", addData)
        .then((res) => {
          toast.success("Movie added");
        })
        .catch((err) => {
          console.log(err);
          toast.error("Error adding movie");
        });
    } else {
      toast.error("image poster is not available");
    }
  };

  const onDelete = (comment) => {
    const shouldDelete = window.confirm("Do you really want to delete?");
    if (shouldDelete) {
      let deleteData = {
        user,
        comment: comment?.comment,
        Movie_id: data?.id,
      };
      axios
        .delete("/delete", {
          data: deleteData,
        })
        .then((res) => {
          toast.success("comments deleted successfully");
          setDel(res.data);
        })

        .catch((err) => console.log(err));
    }
  };

  return (
    <div className="detailsBanner">
      {!loading ? (
        <>
          {!!data && (
            <React.Fragment>
              <div className="backdrop-img">
                <Img src={url.backdrop + data.backdrop_path} />
              </div>
              <div className="opacity-layer"></div>
              <ContentWrapper>
                <div className="content">
                  <div className="left">
                    {data.poster_path ? (
                      <Img
                        className="posterImg"
                        src={url.backdrop + data.poster_path}
                      />
                    ) : (
                      <Img className="posterImg" src={PosterFallback} />
                    )}
                  </div>
                  <div className="right">
                    <div className="title">
                      {`${data.name || data.title} (${dayjs(
                        data?.release_date
                      ).format("YYYY")})`}
                    </div>
                    <div className="subtitle">{data.tagline}</div>

                    <Genres data={_genres} />

                    <div className="row">
                      <CircleRating rating={data.vote_average.toFixed(1)} />
                      <div
                        className="playbtn"
                        onClick={() => {
                          setShow(true);
                          setVideoId(video.key);
                        }}
                      >
                        <PlayIcon />
                        <span className="text">Watch Trailer</span>
                      </div>

                      {user && (
                        <div className="addList" onClick={() => addList()}>
                          <GrAddCircle className="circle" />
                        </div>
                      )}
                    </div>

                    <div className="overview">
                      <div className="heading">Overview</div>
                      <div className="description">{data.overview}</div>
                    </div>

                    <div className="info">
                      {data.status && (
                        <div className="infoItem">
                          <span className="text bold">Status: </span>
                          <span className="text">{data.status}</span>
                        </div>
                      )}
                      {data.release_date && (
                        <div className="infoItem">
                          <span className="text bold">Release Date: </span>
                          <span className="text">
                            {dayjs(data.release_date).format("MMM D, YYYY")}
                          </span>
                        </div>
                      )}
                      {data.runtime && (
                        <div className="infoItem">
                          <span className="text bold">Runtime: </span>
                          <span className="text">
                            {toHoursAndMinutes(data.runtime)}
                          </span>
                        </div>
                      )}
                    </div>

                    {director?.length > 0 && (
                      <div className="info">
                        <span className="text bold">Director: </span>
                        <span className="text">
                          {director?.map((d, i) => (
                            <span key={i}>
                              {d.name}
                              {director.length - 1 !== i && ", "}
                            </span>
                          ))}
                        </span>
                      </div>
                    )}

                    {writer?.length > 0 && (
                      <div className="info">
                        <span className="text bold">Writer: </span>
                        <span className="text">
                          {writer?.map((d, i) => (
                            <span key={i}>
                              {d.name}
                              {writer.length - 1 !== i && ", "}
                            </span>
                          ))}
                        </span>
                      </div>
                    )}

                    {data?.created_by?.length > 0 && (
                      <div className="info">
                        <span className="text bold">Creator: </span>
                        <span className="text">
                          {data?.created_by?.map((d, i) => (
                            <span key={i}>
                              {d.name}
                              {data?.created_by.length - 1 !== i && ", "}
                            </span>
                          ))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <VideoPopup
                  show={show}
                  setShow={setShow}
                  videoId={videoId}
                  setVideoId={setVideoId}
                />
              </ContentWrapper>
            </React.Fragment>
          )}
        </>
      ) : (
        <div className="detailsBannerSkeleton">
          <ContentWrapper>
            <div className="left skeleton"></div>
            <div className="right">
              <div className="row skeleton"></div>
              <div className="row skeleton"></div>
              <div className="row skeleton"></div>
              <div className="row skeleton"></div>
              <div className="row skeleton"></div>
              <div className="row skeleton"></div>
              <div className="row skeleton"></div>
            </div>
          </ContentWrapper>
        </div>
      )}
      {/* reviews */}

      <form className="comment-form" onSubmit={handleSubmit}>
        <div className="comment-review">Reviews</div>
        <div className="comment-section">
          {fetchComment?.map((item, index) => {
            return (
              <div key={index}>
                <p className="comment-name">{name[0]?.displayName}</p>
                <span className="comments">{item.comment}</span>
                {user === item.user && (
                  <span
                    type="button"
                    className="delete-btn"
                    onClick={() => onDelete(item)}
                  >
                    delete
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="comment-text">
          <div className="comment-area">
            <textarea rows={4} cols={10} onChange={handleChange} />
          </div>
        </div>
        <button className="comment-btn">post</button>
      </form>
    </div>
  );
};

export default DetailsBanner;
