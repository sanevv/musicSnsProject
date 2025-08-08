package com.github.musicsnsproject.service.music.external;

import com.github.musicsnsproject.web.dto.music.external.ExternalChartResponse;

import com.github.musicsnsproject.web.dto.music.external.ExternalDetailResponse;
import com.github.musicsnsproject.web.dto.response.CustomSuccessResponse;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class MelonChartService {
    // Get 24Hits Chart
    public List<ExternalChartResponse> getMelonChartTop100(String artistName) throws Exception {
        String url = "https://www.melon.com/chart/index.htm";
        Document doc = Jsoup.connect(url).userAgent("Chrome").get();

        List<String> artistNames = getTextsOfElements(doc, ".wrap_song_info .rank02 span");
        List<String> titles = getTextsOfElements(doc, ".wrap_song_info .rank01 span a");
        List<String> albumNames = getTextsOfElements(doc, ".wrap_song_info .rank03 a");
        List<String> albumArts = getAttrsOfElements(doc, ".image_typeAll img", "src");
        List<String> songNumbers = getAttrsOfElements(doc, "tr[data-song-no]", "data-song-no");

        List<ExternalChartResponse> data = new ArrayList<>();
        for (int i = 0; i < titles.size(); i++) {
            if (artistName == null || artistNames.get(i).contains(artistName)) {
                data.add(ExternalChartResponse.builder()
                        .rank(i + 1)
                        .artistName(artistNames.get(i))
                        .title(titles.get(i))
                        .albumName(albumNames.get(i))
                        .albumArt(albumArts.get(i))
                        .songNumber(songNumbers.get(i))
                        .build());
            }
        }
        return data;
    }

    // Get tag value
    private List<String> getTextsOfElements(Document doc, String selector) {
        return doc.select(selector).stream()
                .map(Element::text)
                .collect(Collectors.toList());
    }

    // Get tag attribute values
    private List<String> getAttrsOfElements(Document doc, String selector, String attr) {
        return doc.select(selector).stream()
                .map(element -> element.attr(attr))
                .collect(Collectors.toList());
    }

    // Find AlbumNames By ArtistName
    public List<ExternalDetailResponse> getAlbums(String artistName) throws Exception {
        String url = "https://www.melon.com/search/album/index.htm?q=" +
                artistName +
                "&section=&searchGnbYn=Y&kkoSpl=Y&kkoDpType=&linkOrText=T&ipath=srch_form";
        Document doc = Jsoup.connect(url).userAgent("Chrome").get();
        List<ExternalDetailResponse> data = new ArrayList<>();
        for (Element element : doc.select("dt > a")) {
            Matcher m = Pattern.compile("goAlbumDetail\\('(.*?)'\\)").matcher(element.attr("href"));
            while (m.find()) {
                data.add(ExternalDetailResponse.builder()
                        .title(element.text())
                        .number(m.group(1))
                        .build());
            }
        }
        return data;
    }

    // Find Songs By AlbumNumber
    public List<ExternalDetailResponse> getSongLists(String albumNumber) throws Exception {
        String url = "https://www.melon.com/album/detail.htm?albumId=" + albumNumber;
        Document doc = Jsoup.connect(url).userAgent("Chrome").get();
        List<ExternalDetailResponse> data = new ArrayList<>();
        for (Element element : doc.select(".wrap_song_info .ellipsis > span > a")) {
            Matcher m = Pattern.compile(",(.*?)\\)").matcher(element.attr("href"));
            while (m.find()) {
                data.add(ExternalDetailResponse.builder()
                        .title(element.text())
                        .number(m.group(1))
                        .build());
            }
        }
        return data;
    }
}
