
//This Code is Copy of Original Code in GEE , executing this code will not work


var s2: ImageCollection "Sentinel-2 MSI: MultiSpectral Instrument, Level-2A"
var klt: Polygon, 4 vertices
var forest: FeatureCollection (10 elements)
var urban: FeatureCollection (10 elements)
var water: FeatureCollection (10 elements)
var agriculture: FeatureCollection (7 elements)

var s2_klt_2023 = s2.filterDate('2023-01-01', '2023-12-31').filterBounds(klt).median();
// Define a region of interest.
// Select bands and create an image with spectral indices.
var bands = ['B2', 'B3', 'B4', 'B8'];
var s2_klt_2023 = s2_klt_2023.select(bands).addBands(s2_klt_2023.normalizedDifference(['B8','B4']).rename('NDVI'));
var displayparameters = {
min: 1000,
max: 4500,
bands: ['B8', 'B4', 'B3'],
};
Map.addLayer(s2_klt_2023,displayparameters,"Image");
// Load training data (e.g., land cover classes).
var label = "Class";
var training = forest.merge(urban).merge(water).merge(agriculture);

var trainingimage = s2_klt_2023.sampleRegions({
collection: training,
properties: [label],
scale: 10
})
var traingData = trainingimage.randomColumn();
var trainSet = traingData.filter(ee.Filter.lessThan('random',0.8));
var testSet = traingData.filter(ee.Filter.greaterThanOrEquals('random',0.8));

var classifier = ee.Classifier.smileRandomForest({numberOfTrees:100, variablesPerSplit: 2,minLeafPopulation: 1, bagFraction: 0.5,seed: 0});

//Train the classifier on the training dataset
var classifier = ee.Classifier.smileRandomForest(100).train(trainSet, label, bands);

var classified =s2_klt_2023.classify(classifier);
// Display the results.
Map.centerObject(klt, 10);
Map.addLayer(classified, {min: 1, max: 4, palette: ['green', 'red', 'blue','yellow']}, 'Land Cover');
//Get information about the trained classifier
print('Results of trained classifier', classifier.explain());
//Get a confusion matrix and overall accuracy for the training sample
var trainAccuracy = classifier.confusionMatrix();
print('Training error matrix', trainAccuracy);
print('Training overall accuracy', trainAccuracy.accuracy());
testSet = testSet.classify(classifier);
var validationAccuracy = testSet.errorMatrix(label,'classification');
print('Validation error matrix', validationAccuracy);
print('Validation accuracy', validationAccuracy.accuracy());


