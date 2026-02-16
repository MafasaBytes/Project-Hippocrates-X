#include <iostream>
#include <filesystem>
#include <thread>
#include <vector>
#include <cstdlib>

namespace fs = std::filesystem;

void download_dataset(const std::string& kaggle_path, const std::string& save_dir, const std::string& name) {
    std::cout << "Downloading... " << name << " to: " << save_dir << std::endl;

    std::string cmd = "kaggle datasets download -d " + kaggle_path +
                     " -p " + save_dir + " --unzip --quiet";

    int result = std::system(cmd.c_str());

    if (result != 0) {
        std::cerr << "   Failed to download " << name << std::endl;
        std::cerr << "   Check: 'kaggle config -p ~/.kaggle/kaggle.json' exists" << std::endl;
        std::cerr << "   Command: " << cmd << std::endl;
    } else {
        std::cout << "[OK]" << name << " downloaded successfully" << std::endl;
    }
}

int main() {
    std::vector<std::thread> download_threads;

    // Launch all downloads in parallel
    download_threads.emplace_back(download_dataset,
        "nih-chest-xrays/data",                // Kaggle dataset path
        "data/raw/NIH-ChestX-ray14",           // Your existing directory
        "NIH ChestX-ray14"
    );

    download_threads.emplace_back(download_dataset,
        "tanvishdesai/mimic-cxr",
        "data/raw/MIMIC-CXR",
        "MIMIC-CXR"
    );

    download_threads.emplace_back(download_dataset,
        "ashery/chexpert",
        "data/raw/CheXpert",
        "CheXpert"
    );

    // Wait for all downloads
    for (auto& t : download_threads) {
        t.join();
    }

    std::cout << "\nAll datasets saved to your existing directories!" << std::endl;
    return 0;
}
