# Three.js Soil Volume Compare

This project compares different approaches to volumetric data visualization in Three.js:
  - Using GLB format
  - Three.js [`VolumeRenderShader1`](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/shaders/VolumeShader.js)
  - Custom shader [`@agrodt/three-soil-volume-shader`](https://github.com/AgroDT/three-soil-volume-shader)

See the [demo](https://agrodt.github.io/ThreeSoilVolumeCompare/)

## Running Locally

To run this project locally:

1. Install [Bun](https://bun.sh/).

2. Clone the repository:

```sh
git clone 1 https://github.com/AgroDT/ThreeSoilVolumeCompare.git
```

3. Install dependencies:

```sh
bun i
```

3. Run the development server:

```sh
bun dev
```

## License

This project is licensed under the [MIT License](LICENSE).