#include <iostream>
#include <fstream>
#include <curl/curl.h>
#include <filesystem>
#include <iomanip>
#include <chrono>
#include <thread>
#include <vector>
#include <mutex>

namespace fs = std::filesystem;

class DatasetDownloader {
private:
    std::mutex mtx;
    size_t total_downloaded = 0;
    size_t total_size = 0;

    static size_t write_data(void* ptr, size_t size, size_t nmemb, FILE* stream) {
        return fwrite(ptr, size, nmemb, stream);
    }

    static int progress_callback(void* clientp, curl_off_t dltotal, curl_off_t dlnow, curl_off_t, curl_off_t) {
        auto* self = static_cast<DatasetDownloader*>(clientp);
        self->mtx.lock();
        self->total_downloaded = dlnow;
        self->mtx.unlock();
        return 0;
    }

public:
    void download(const std::string& url, const std::string& output_path, const std::string& dir_name) {
        CURL* curl = curl_easy_init();
        FILE* fp = fopen(output_path.c_str(), "wb");

        std::cout << "Downloading " << dir_name << " to: " << output_path << std::endl;

        if (curl && fp) {
            curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
            curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_data);
            curl_easy_setopt(curl, CURLOPT_WRITEDATA, fp);
            curl_easy_setopt(curl, CURLOPT_NOPROGRESS, 0L);
            curl_easy_setopt(curl, CURLOPT_XFERINFOFUNCTION, progress_callback);
            curl_easy_setopt(curl, CURLOPT_XFERINFODATA, this);
            curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);

            // Get file size for progress bar
            curl_easy_getinfo(curl, CURLINFO_SIZE_DOWNLOAD_T, &total_size);

            auto start = std::chrono::steady_clock::now();
            CURLcode res = curl_easy_perform(curl);

            if (res != CURLE_OK) {
                std::cerr << "Download failed: " << curl_easy_strerror(res) << std::endl;
            } else {
                auto end = std::chrono::steady_clock::now();
                auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
                std::cout << "Completed in " << duration/1000.0 << "s (" 
                          << (total_size/(1024*1024))/static_cast<double>(duration/1000.0)
                          << " MB/s)" << std::endl;
            }

            fclose(fp);
            curl_easy_cleanup(curl);
        }
    }

    void show_progress() {
        while (true) {
            mtx.lock();
            size_t current = total_downloaded;
            mtx.unlock();

            if (current > 0 && total_size > 0) {
                float progress = static_cast<float>(current) / total_size;
                int bar_width = 50;
                std::cout << "[";
                int pos = bar_width * progress;
                for (int i = 0; i < bar_width; ++i) {
                    if (i < pos) std::cout << "=";
                    else if (i == pos) std::cout << ">";
                    else std::cout << " ";
                }
                std::cout << "] " << int(progress * 100.0) << "%\r";
                std::cout.flush();
            }

            if (current == total_size && total_size > 0) break;
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
    }
};

int main() {
    DatasetDownloader downloader;

    // Create threads for parallel downloads
    std::vector<std::thread> threads;

    // NIH ChestX-ray14
    threads.emplace_back([&]() {
        fs::create_directories("data/raw/NIH-ChestX-ray14");
        std::thread progress_thread(&DatasetDownloader::show_progress, &downloader);
        downloader.download(
            "https://nihcc.app.box.com/v/ChestXray-NIHCC", 
            "data/raw/NIH-ChestX-ray14/images.zip",
            "NIH ChestX-ray14"
        );
        progress_thread.join();
    });

    // CheXpert
    threads.emplace_back([&]() {
        fs::create_directories("data/raw/CheXpert");
        std::thread progress_thread(&DatasetDownloader::show_progress, &downloader);
        downloader.download(
            "https://stanfordmlgroup.github.io/competitions/chexpert/",
            "data/raw/CheXpert/images.zip",
            "CheXpert"
        );
        progress_thread.join();
    });

    // MIMIC-CXR
    threads.emplace_back([&]() {
        fs::create_directories("data/raw/MIMIC-CXR");
        std::thread progress_thread(&DatasetDownloader::show_progress, &downloader);
        downloader.download(
            "https://physionet.org/content/mimic-cxr-jpg/2.0.0/", 
            "data/raw/MIMIC-CXR/images.zip",
            "MIMIC-CXR"
        );
        progress_thread.join();
    });

    // Wait for all downloads
    for (auto& t : threads) t.join();

    std::cout << "\nAll datasets downloaded successfully!" << std::endl;
    return 0;
}
