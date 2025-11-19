namespace ProjectionsApi.Domain;

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Skip { get; set; }
    public int Take { get; set; }
    public bool HasNextPage => Skip + Take < TotalCount;
    public bool HasPreviousPage => Skip > 0;
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / Take);
    public int CurrentPage => (Skip / Take) + 1;
}

